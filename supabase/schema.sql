-- ==============================================================================
-- KTU Notes Hub — Database Schema & Security Architecture
-- ==============================================================================
-- Designed for: APJ Abdul Kalam Technological University (KTU) Notes Hub
-- College Scope: Initial 7 Programmes and 11 Programme-Semester Combinations
-- Hierarchy: Programme -> Scheme -> Semester -> Subject -> Module -> Notes
-- Soft-deletion / preservation: is_active / is_published flags prevent data loss
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADMIN PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ACADEMIC SCHEMES TABLE
CREATE TABLE IF NOT EXISTS public.schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROGRAMMES / COURSES TABLE
CREATE TABLE IF NOT EXISTS public.programmes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    degree_type TEXT NOT NULL CHECK (degree_type IN ('B.Tech', 'Undergraduate', 'Postgraduate', 'Diploma')),
    scheme TEXT NOT NULL DEFAULT 'KTU 2024 Scheme',
    icon_name TEXT DEFAULT 'BookOpen',
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PROGRAMME SEMESTERS TABLE (M:1 relationship with programmes)
CREATE TABLE IF NOT EXISTS public.programme_semesters (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
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

-- 6. SUBJECTS TABLE
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

-- 7. MODULES TABLE (Typically 1 to 5 modules per KTU subject)
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 6),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_subject_module UNIQUE (subject_id, module_number)
);

-- 8. ACADEMIC NOTES / PDF MATERIALS TABLE
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

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_programmes_active ON public.programmes(is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_prog ON public.programme_semesters(programme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(programme_semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON public.modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_module_published ON public.notes(module_id, is_published);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Helper function: check if caller is an authorized admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PUBLIC STUDENTS POLICIES (Unauthenticated / Public Read-Only Access)
-- Students can read only active programmes, active semesters, active subjects, and published notes.
CREATE POLICY "Public students can view active schemes"
    ON public.schemes FOR SELECT USING (is_active = true);

CREATE POLICY "Public students can view active programmes"
    ON public.programmes FOR SELECT USING (is_active = true);

CREATE POLICY "Public students can view active semesters"
    ON public.programme_semesters FOR SELECT USING (is_active = true);

CREATE POLICY "Public students can view active subjects"
    ON public.subjects FOR SELECT USING (is_active = true);

CREATE POLICY "Public students can view modules of active subjects"
    ON public.modules FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subjects s
            WHERE s.id = modules.subject_id AND s.is_active = true
        )
    );

CREATE POLICY "Public students can view and download published notes only"
    ON public.notes FOR SELECT USING (is_published = true);

-- ADMINISTRATOR POLICIES (Full CRUD access for verified admins)
CREATE POLICY "Admins have full access to programmes"
    ON public.programmes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to programme semesters"
    ON public.programme_semesters FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to subjects"
    ON public.subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to modules"
    ON public.modules FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to notes"
    ON public.notes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- INITIAL SEED DATA: Exactly 7 College Programmes & 11 Semesters
-- ==============================================================================
INSERT INTO public.schemes (id, name, year, description, is_active)
VALUES
    ('ktu-2024', 'KTU 2024 Scheme', 2024, 'Official revised scheme for APJ Abdul Kalam Technological University', true),
    ('univ-general', 'University Curriculum', 2024, 'Autonomous/University curriculum for non-engineering programmes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.programmes (id, code, name, full_name, degree_type, scheme, icon_name, description, sort_order, is_active)
VALUES
    ('btech-aids', 'AI & DS', 'B.Tech AI & DS', 'Artificial Intelligence & Data Science', 'B.Tech', 'KTU 2024 Scheme', 'Bot', 'Foundational computing, linear algebra, Python programming, and data engineering fundamentals.', 1, true),
    ('btech-cse', 'CSE', 'B.Tech CSE', 'Computer Science & Engineering', 'B.Tech', 'KTU 2024 Scheme', 'Cpu', 'Computational thinking, programming methodologies, computer systems, and core software theory.', 2, true),
    ('btech-csbs', 'CSBS', 'B.Tech CSBS', 'Computer Science & Business Systems', 'B.Tech', 'KTU 2024 Scheme', 'Binary', 'Interdisciplinary curriculum blending core computer science with enterprise and business applications.', 3, true),
    ('bca', 'BCA', 'BCA', 'Bachelor of Computer Applications', 'Undergraduate', 'University Curriculum', 'Code2', 'Software development applications, database concepts, web fundamentals, and practical computing.', 4, true),
    ('bba', 'BBA', 'BBA', 'Bachelor of Business Administration', 'Undergraduate', 'University Curriculum', 'Briefcase', 'Principles of management, business economics, financial accounting, and organizational dynamics.', 5, true),
    ('mba', 'MBA', 'MBA', 'Master of Business Administration', 'Postgraduate', 'University Curriculum', 'GraduationCap', 'Advanced managerial economics, organizational behaviour, accounting for managers, and strategic operations.', 6, true),
    ('ece', 'ECE', 'ECE', 'Electronics & Communication Engineering', 'B.Tech', 'KTU 2024 Scheme', 'Radio', 'Electronic devices, circuit theory, signal analysis, network theory, and basic communication systems.', 7, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    description = EXCLUDED.description;

-- Exactly 11 Programme-Semester Combinations
INSERT INTO public.programme_semesters (id, programme_id, semester_number, title, phase, focus, description, sort_order, is_active)
VALUES
    -- B.Tech AI & DS (S1, S2, S3)
    ('btech-aids-s1', 'btech-aids', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Engineering physics, mathematics, basic electrical and computing foundational modules.', 1, true),
    ('btech-aids-s2', 'btech-aids', 2, 'Semester 2', 'First Year', 'Engineering Sciences & Programming', 'Advanced mathematics, algorithmic thinking, Python fundamentals, and engineering mechanics.', 2, true),
    ('btech-aids-s3', 'btech-aids', 3, 'Semester 3', 'Second Year', 'AI Fundamentals & Data Structures', 'Discrete mathematical structures, data structures, object-oriented concepts, and AI basics.', 3, true),
    -- B.Tech CSE (S1, S2, S3)
    ('btech-cse-s1', 'btech-cse', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Calculus, engineering physics, introductory computing, and basic engineering workshops.', 1, true),
    ('btech-cse-s2', 'btech-cse', 2, 'Semester 2', 'First Year', 'Engineering Sciences & Problem Solving', 'Differential equations, programming in C/Python, basic electronics, and digital systems.', 2, true),
    ('btech-cse-s3', 'btech-cse', 3, 'Semester 3', 'Second Year', 'Core Computing & Data Structures', 'Discrete mathematics, data structures and algorithms, digital logic design, and system software.', 3, true),
    -- B.Tech CSBS (S1)
    ('btech-csbs-s1', 'btech-csbs', 1, 'Semester 1', 'First Year', 'Engineering & Business Foundations', 'Introductory calculus, physics, fundamental computing concepts, and business communication basics.', 1, true),
    -- BCA (S1)
    ('bca-s1', 'bca', 1, 'Semester 1', 'First Year', 'Computer Fundamentals & Programming', 'Mathematical foundations, computer fundamentals, problem solving techniques, and office automation.', 1, true),
    -- BBA (S1)
    ('bba-s1', 'bba', 1, 'Semester 1', 'First Year', 'Management Principles & Business Environment', 'Principles of management, business economics, financial accounting fundamentals, and business communication.', 1, true),
    -- MBA (S1)
    ('mba-s1', 'mba', 1, 'Semester 1', 'First Year', 'Managerial Foundations & Business Analytics', 'Management theory, managerial economics, accounting for managers, quantitative techniques, and business ethics.', 1, true),
    -- ECE (S1)
    ('ece-s1', 'ece', 1, 'Semester 1', 'First Year', 'Basic Sciences & Engineering Foundation', 'Calculus, engineering physics/chemistry, basic electronics, and engineering graphics.', 1, true)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    phase = EXCLUDED.phase,
    focus = EXCLUDED.focus,
    description = EXCLUDED.description;
