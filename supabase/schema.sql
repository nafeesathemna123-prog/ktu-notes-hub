-- ==============================================================================
-- KTU Notes Hub — Database Schema, Security Architecture & Storage Config
-- ==============================================================================
-- Purpose: Academic notes library for college programmes under KTU & affiliated curricula.
-- Scope: Exactly 7 active programmes and 11 programme-semester combinations.
-- Architecture: Schemes -> Programmes -> Academic Batches -> Programme Semesters -> Subjects -> Modules -> Notes
-- Deactivation: Uses 'is_active' soft-deletion flags and 'ON DELETE RESTRICT' to prevent data loss.
-- Idempotency: All statements use IF NOT EXISTS, DROP POLICY IF EXISTS, and ON CONFLICT.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. SCHEMES TABLE (Curriculum Guidelines / Schemes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PROGRAMMES / COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programmes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    degree_type TEXT NOT NULL CHECK (degree_type IN ('B.Tech', 'Undergraduate', 'Postgraduate', 'Diploma')),
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
    icon_name TEXT DEFAULT 'BookOpen',
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. ACADEMIC BATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_batches (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    academic_year TEXT,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_programme_batch UNIQUE (programme_id, name)
);

-- ------------------------------------------------------------------------------
-- 5. PROGRAMME SEMESTERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programme_semesters (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
    batch_id TEXT REFERENCES public.academic_batches(id) ON DELETE RESTRICT,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    title TEXT NOT NULL,
    phase TEXT NOT NULL,
    focus TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_programme_semester UNIQUE (programme_id, semester_number)
);

-- ------------------------------------------------------------------------------
-- 6. SUBJECTS TABLE (Curation ready; no fake subjects seeded)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_semester_id TEXT NOT NULL REFERENCES public.programme_semesters(id) ON DELETE RESTRICT,
    code TEXT,
    name TEXT NOT NULL,
    credits INTEGER DEFAULT 3,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. MODULES TABLE (With safe 'is_active' deactivation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 6),
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_subject_module UNIQUE (subject_id, module_number)
);

-- ------------------------------------------------------------------------------
-- 8. ADMIN PROFILES TABLE (Linked to Supabase Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. ACADEMIC NOTES / PDF MATERIALS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    is_published BOOLEAN NOT NULL DEFAULT false,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. INDEXES FOR PERFORMANCE AND SEARCH
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_programmes_scheme ON public.programmes(scheme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_programme ON public.academic_batches(programme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_programme ON public.programme_semesters(programme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(programme_semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON public.modules(subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_module_published ON public.notes(module_id, is_published);

-- ------------------------------------------------------------------------------
-- 11. SECURITY DEFINER HELPER FUNCTIONS (Secured with fixed search_path)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;

-- Function to safely bootstrap the initial super administrator (Only works if 0 admins exist)
CREATE OR REPLACE FUNCTION public.bootstrap_initial_admin(admin_id UUID, admin_email TEXT, admin_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.admin_profiles) THEN
        RAISE EXCEPTION 'An administrator already exists. Further admin management must be performed by an authorized super_admin.';
    END IF;

    INSERT INTO public.admin_profiles (id, email, full_name, role)
    VALUES (admin_id, admin_email, admin_name, 'super_admin');
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_initial_admin(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_admin(UUID, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- --- A. ADMIN PROFILES POLICIES ---
-- Strict protection: anonymous/students have zero access.
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
    ON public.admin_profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can manage admin profiles"
    ON public.admin_profiles FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- --- B. SCHEMES POLICIES ---
DROP POLICY IF EXISTS "Public students can view active schemes" ON public.schemes;
CREATE POLICY "Public students can view active schemes"
    ON public.schemes FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins have full access to schemes" ON public.schemes;
CREATE POLICY "Admins have full access to schemes"
    ON public.schemes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- C. PROGRAMMES POLICIES (Active scheme hierarchy required) ---
DROP POLICY IF EXISTS "Public students can view active programmes with active scheme" ON public.programmes;
CREATE POLICY "Public students can view active programmes with active scheme"
    ON public.programmes FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.schemes sc
            WHERE sc.id = programmes.scheme_id
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to programmes" ON public.programmes;
CREATE POLICY "Admins have full access to programmes"
    ON public.programmes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- D. ACADEMIC BATCHES POLICIES ---
DROP POLICY IF EXISTS "Public students can view active batches with active hierarchy" ON public.academic_batches;
CREATE POLICY "Public students can view active batches with active hierarchy"
    ON public.academic_batches FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programmes p
            JOIN public.schemes sc ON sc.id = p.scheme_id
            WHERE p.id = academic_batches.programme_id
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to academic batches" ON public.academic_batches;
CREATE POLICY "Admins have full access to academic batches"
    ON public.academic_batches FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- E. PROGRAMME SEMESTERS POLICIES (Active parent programme & scheme required) ---
DROP POLICY IF EXISTS "Public students can view active semesters with active hierarchy" ON public.programme_semesters;
CREATE POLICY "Public students can view active semesters with active hierarchy"
    ON public.programme_semesters FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programmes p
            JOIN public.schemes sc ON sc.id = p.scheme_id
            WHERE p.id = programme_semesters.programme_id
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to programme semesters" ON public.programme_semesters;
CREATE POLICY "Admins have full access to programme semesters"
    ON public.programme_semesters FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- F. SUBJECTS POLICIES (Active parent semester, programme & scheme required) ---
DROP POLICY IF EXISTS "Public students can view active subjects with active hierarchy" ON public.subjects;
CREATE POLICY "Public students can view active subjects with active hierarchy"
    ON public.subjects FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programme_semesters ps
            JOIN public.programmes p ON p.id = ps.programme_id
            JOIN public.schemes sc ON sc.id = p.scheme_id
            WHERE ps.id = subjects.programme_semester_id
              AND ps.is_active = true
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to subjects" ON public.subjects;
CREATE POLICY "Admins have full access to subjects"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- G. MODULES POLICIES (Active parent subject, semester, programme & scheme required) ---
DROP POLICY IF EXISTS "Public students can view active modules with active hierarchy" ON public.modules;
CREATE POLICY "Public students can view active modules with active hierarchy"
    ON public.modules FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.subjects s
            JOIN public.programme_semesters ps ON ps.id = s.programme_semester_id
            JOIN public.programmes p ON p.id = ps.programme_id
            JOIN public.schemes sc ON sc.id = p.scheme_id
            WHERE s.id = modules.subject_id
              AND s.is_active = true
              AND ps.is_active = true
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to modules" ON public.modules;
CREATE POLICY "Admins have full access to modules"
    ON public.modules FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- H. NOTES POLICIES (Published note AND entire active parent hierarchy required) ---
DROP POLICY IF EXISTS "Public students can view published notes with active hierarchy" ON public.notes;
CREATE POLICY "Public students can view published notes with active hierarchy"
    ON public.notes FOR SELECT
    USING (
        is_published = true
        AND EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.subjects s ON s.id = m.subject_id
            JOIN public.programme_semesters ps ON ps.id = s.programme_semester_id
            JOIN public.programmes p ON p.id = ps.programme_id
            JOIN public.schemes sc ON sc.id = p.scheme_id
            WHERE m.id = notes.module_id
              AND m.is_active = true
              AND s.is_active = true
              AND ps.is_active = true
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to notes" ON public.notes;
CREATE POLICY "Admins have full access to notes"
    ON public.notes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. PRIVATE SUPABASE STORAGE CONFIGURATION & POLICIES
-- ------------------------------------------------------------------------------
-- Create the private storage bucket for academic notes (50MB limit, PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'academic-notes',
    'academic-notes',
    false,
    52428800,
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['application/pdf']::text[];

-- Storage Object Policies
DROP POLICY IF EXISTS "Admins can upload note files" ON storage.objects;
CREATE POLICY "Admins can upload note files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'academic-notes'
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can update note files" ON storage.objects;
CREATE POLICY "Admins can update note files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'academic-notes'
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Admins can delete note files" ON storage.objects;
CREATE POLICY "Admins can delete note files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'academic-notes'
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Public and students can download published note files" ON storage.objects;
CREATE POLICY "Public and students can download published note files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'academic-notes'
        AND (
            public.is_admin()
            OR EXISTS (
                SELECT 1 FROM public.notes n
                JOIN public.modules m ON m.id = n.module_id
                JOIN public.subjects s ON s.id = m.subject_id
                JOIN public.programme_semesters ps ON ps.id = s.programme_semester_id
                JOIN public.programmes p ON p.id = ps.programme_id
                JOIN public.schemes sc ON sc.id = p.scheme_id
                WHERE n.file_url LIKE '%' || storage.objects.name
                  AND n.is_published = true
                  AND m.is_active = true
                  AND s.is_active = true
                  AND ps.is_active = true
                  AND p.is_active = true
                  AND sc.is_active = true
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 14. SEED DATA: Exactly 7 College Programmes & 11 Semesters (No fake subjects)
-- ------------------------------------------------------------------------------
-- Schemes
INSERT INTO public.schemes (id, name, year, description, is_active)
VALUES
    ('ktu-2024', 'KTU 2024 Scheme', 2024, 'Official revised scheme for APJ Abdul Kalam Technological University', true),
    ('univ-general', 'University Curriculum', 2024, 'Autonomous/University general degree curriculum', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    year = EXCLUDED.year,
    description = EXCLUDED.description,
    is_active = true;

-- Exactly 7 Programmes (with foreign key to schemes and corrected ECE seed)
INSERT INTO public.programmes (id, code, name, full_name, degree_type, scheme_id, icon_name, description, sort_order, is_active)
VALUES
    ('btech-aids', 'AI & DS', 'B.Tech AI & DS', 'Artificial Intelligence & Data Science', 'B.Tech', 'ktu-2024', 'Bot', 'Foundational computing, linear algebra, Python programming, and data engineering fundamentals.', 1, true),
    ('btech-cse', 'CSE', 'B.Tech CSE', 'Computer Science & Engineering', 'B.Tech', 'ktu-2024', 'Cpu', 'Computational thinking, programming methodologies, computer systems, and core software theory.', 2, true),
    ('btech-csbs', 'CSBS', 'B.Tech CSBS', 'Computer Science & Business Systems', 'B.Tech', 'ktu-2024', 'Binary', 'Interdisciplinary curriculum blending core computer science with enterprise and business applications.', 3, true),
    ('bca', 'BCA', 'BCA', 'Bachelor of Computer Applications', 'Undergraduate', 'univ-general', 'Code2', 'Software development applications, database concepts, web fundamentals, and practical computing.', 4, true),
    ('bba', 'BBA', 'BBA', 'Bachelor of Business Administration', 'Undergraduate', 'univ-general', 'Briefcase', 'Principles of management, business economics, financial accounting, and organizational dynamics.', 5, true),
    ('mba', 'MBA', 'MBA', 'Master of Business Administration', 'Postgraduate', 'univ-general', 'GraduationCap', 'Advanced managerial economics, organizational behaviour, accounting for managers, and strategic operations.', 6, true),
    ('btech-ece', 'ECE', 'B.Tech ECE', 'Electronics and Communication Engineering', 'B.Tech', 'ktu-2024', 'Radio', 'Electronic devices, circuit theory, signal analysis, network theory, and basic communication systems.', 7, true)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    degree_type = EXCLUDED.degree_type,
    scheme_id = EXCLUDED.scheme_id,
    icon_name = EXCLUDED.icon_name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

-- Academic Batches for the initial programmes
INSERT INTO public.academic_batches (id, programme_id, scheme_id, name, academic_year, start_year, end_year, is_active)
VALUES
    ('batch-btech-aids-2024', 'btech-aids', 'ktu-2024', '2024 - 2028 Batch', '2024-2025', 2024, 2028, true),
    ('batch-btech-cse-2024', 'btech-cse', 'ktu-2024', '2024 - 2028 Batch', '2024-2025', 2024, 2028, true),
    ('batch-btech-csbs-2024', 'btech-csbs', 'ktu-2024', '2024 - 2028 Batch', '2024-2025', 2024, 2028, true),
    ('batch-bca-2024', 'bca', 'univ-general', '2024 - 2027 Batch', '2024-2025', 2024, 2027, true),
    ('batch-bba-2024', 'bba', 'univ-general', '2024 - 2027 Batch', '2024-2025', 2024, 2027, true),
    ('batch-mba-2024', 'mba', 'univ-general', '2024 - 2026 Batch', '2024-2025', 2024, 2026, true),
    ('batch-btech-ece-2024', 'btech-ece', 'ktu-2024', '2024 - 2028 Batch', '2024-2025', 2024, 2028, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    academic_year = EXCLUDED.academic_year,
    is_active = true;

-- Exactly 11 Programme-Semester Combinations (Linked to programmes and batches)
INSERT INTO public.programme_semesters (id, programme_id, batch_id, semester_number, title, phase, focus, description, sort_order, is_active)
VALUES
    -- 1. B.Tech AI & DS (S1, S2, S3)
    ('btech-aids-s1', 'btech-aids', 'batch-btech-aids-2024', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Engineering physics, mathematics, basic electrical and computing foundational modules.', 1, true),
    ('btech-aids-s2', 'btech-aids', 'batch-btech-aids-2024', 2, 'Semester 2', 'First Year', 'Engineering Sciences & Programming', 'Advanced mathematics, algorithmic thinking, Python fundamentals, and engineering mechanics.', 2, true),
    ('btech-aids-s3', 'btech-aids', 'batch-btech-aids-2024', 3, 'Semester 3', 'Second Year', 'AI Fundamentals & Data Structures', 'Discrete mathematical structures, data structures, object-oriented concepts, and AI basics.', 3, true),

    -- 2. B.Tech CSE (S1, S2, S3)
    ('btech-cse-s1', 'btech-cse', 'batch-btech-cse-2024', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Calculus, engineering physics, introductory computing, and basic engineering workshops.', 1, true),
    ('btech-cse-s2', 'btech-cse', 'batch-btech-cse-2024', 2, 'Semester 2', 'First Year', 'Engineering Sciences & Problem Solving', 'Differential equations, programming in C/Python, basic electronics, and digital systems.', 2, true),
    ('btech-cse-s3', 'btech-cse', 'batch-btech-cse-2024', 3, 'Semester 3', 'Second Year', 'Core Computing & Data Structures', 'Discrete mathematics, data structures and algorithms, digital logic design, and system software.', 3, true),

    -- 3. B.Tech CSBS (S1)
    ('btech-csbs-s1', 'btech-csbs', 'batch-btech-csbs-2024', 1, 'Semester 1', 'First Year', 'Engineering & Business Foundations', 'Introductory calculus, physics, fundamental computing concepts, and business communication basics.', 1, true),

    -- 4. BCA (S1)
    ('bca-s1', 'bca', 'batch-bca-2024', 1, 'Semester 1', 'First Year', 'Computer Fundamentals & Programming', 'Mathematical foundations, computer fundamentals, problem solving techniques, and office automation.', 1, true),

    -- 5. BBA (S1)
    ('bba-s1', 'bba', 'batch-bba-2024', 1, 'Semester 1', 'First Year', 'Management Principles & Business Environment', 'Principles of management, business economics, financial accounting fundamentals, and business communication.', 1, true),

    -- 6. MBA (S1)
    ('mba-s1', 'mba', 'batch-mba-2024', 1, 'Semester 1', 'First Year', 'Managerial Foundations & Business Analytics', 'Management theory, managerial economics, accounting for managers, quantitative techniques, and business ethics.', 1, true),

    -- 7. B.Tech ECE (S1)
    ('btech-ece-s1', 'btech-ece', 'batch-btech-ece-2024', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Calculus, engineering physics/chemistry, basic electronics, and engineering graphics.', 1, true)
ON CONFLICT (id) DO UPDATE SET
    programme_id = EXCLUDED.programme_id,
    batch_id = EXCLUDED.batch_id,
    semester_number = EXCLUDED.semester_number,
    title = EXCLUDED.title,
    phase = EXCLUDED.phase,
    focus = EXCLUDED.focus,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = true;
