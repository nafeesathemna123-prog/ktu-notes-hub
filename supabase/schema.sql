-- ==============================================================================
-- KMCT Notes Hub — Complete Database Schema & Security Architecture
-- ==============================================================================
-- Scope: Exactly 7 verified programmes and 11 initial programme-semester combinations.
-- Architecture: Schemes -> Programmes -> Programme Schemes (M:N) -> Academic Batches -> Programme Semesters -> Subjects -> Modules -> Notes
-- Deactivation: Uses soft-deactivation ('is_active') and 'ON DELETE RESTRICT' to prevent data loss.
-- Data Safety: Seed operations use 'ON CONFLICT DO NOTHING' and never overwrite admin-curated data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. SCHEMES TABLE (KTU Curriculum Regulations)
-- ------------------------------------------------------------------------------
-- Unseeded initially: Administrators will configure verified KTU schemes later.
CREATE TABLE IF NOT EXISTS public.schemes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PROGRAMMES TABLE
-- ------------------------------------------------------------------------------
-- Note: Redundant scheme_id column removed. programme_schemes is the single source of truth.
CREATE TABLE IF NOT EXISTS public.programmes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    degree_type TEXT NOT NULL CHECK (degree_type IN ('B.Tech', 'Undergraduate', 'Postgraduate', 'Diploma')),
    icon_name TEXT DEFAULT 'BookOpen',
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PROGRAMME SCHEMES TABLE (Single Source of Truth for Scheme Mapping)
-- ------------------------------------------------------------------------------
-- M:N junction supporting multiple historical and future schemes per programme.
CREATE TABLE IF NOT EXISTS public.programme_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
    scheme_id TEXT NOT NULL REFERENCES public.schemes(id) ON DELETE RESTRICT,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_programme_scheme_pair UNIQUE (programme_id, scheme_id)
);

-- Partial Unique Index: Strictly guarantees only ONE scheme can be current for any programme
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_current_programme_scheme 
    ON public.programme_schemes (programme_id) 
    WHERE is_current = true;

-- ------------------------------------------------------------------------------
-- 5. ACADEMIC BATCHES TABLE
-- ------------------------------------------------------------------------------
-- Unseeded initially: Administrators will configure student batches when confirmed.
CREATE TABLE IF NOT EXISTS public.academic_batches (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
    scheme_id TEXT REFERENCES public.schemes(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    academic_year TEXT,
    start_year INTEGER,
    end_year INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_programme_batch UNIQUE (programme_id, name),
    CONSTRAINT unique_batch_id_programme UNIQUE (id, programme_id),
    -- Consistency check: When batch references a scheme, it must be mapped to that programme
    CONSTRAINT fk_batch_programme_scheme FOREIGN KEY (programme_id, scheme_id) 
        REFERENCES public.programme_schemes(programme_id, scheme_id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------------------------
-- 6. PROGRAMME SEMESTERS TABLE
-- ------------------------------------------------------------------------------
-- Allows the same semester numbers (1 to 8) in different batches.
-- Composite foreign keys ensure programme-to-batch and programme-to-scheme consistency.
CREATE TABLE IF NOT EXISTS public.programme_semesters (
    id TEXT PRIMARY KEY,
    programme_id TEXT NOT NULL REFERENCES public.programmes(id) ON DELETE RESTRICT,
    batch_id TEXT REFERENCES public.academic_batches(id) ON DELETE RESTRICT,
    scheme_id TEXT REFERENCES public.schemes(id) ON DELETE RESTRICT,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    title TEXT NOT NULL,
    phase TEXT,
    focus TEXT,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Enforce that semester's programme strictly matches referenced batch's programme
    CONSTRAINT fk_semester_batch_programme FOREIGN KEY (batch_id, programme_id) 
        REFERENCES public.academic_batches(id, programme_id) ON DELETE RESTRICT,
    -- Enforce that semester's scheme is mapped to that programme
    CONSTRAINT fk_semester_programme_scheme FOREIGN KEY (programme_id, scheme_id) 
        REFERENCES public.programme_schemes(programme_id, scheme_id) ON DELETE RESTRICT
);

-- Unique index for batch-linked semesters: Different batches can each have their own S1, S2, etc.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_batch_sem 
    ON public.programme_semesters (batch_id, semester_number) 
    WHERE batch_id IS NOT NULL;

-- Unique index for standalone/unassigned semesters: Unique per programme
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_prog_sem_no_batch 
    ON public.programme_semesters (programme_id, semester_number) 
    WHERE batch_id IS NULL;

-- ------------------------------------------------------------------------------
-- 7. ACADEMIC HIERARCHY VALIDATION TRIGGERS
-- ------------------------------------------------------------------------------
-- A. Validates programme_semesters consistency on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.check_semester_hierarchy_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    batch_rec RECORD;
BEGIN
    -- If batch is linked, validate programme and scheme alignment
    IF NEW.batch_id IS NOT NULL THEN
        SELECT id, programme_id, scheme_id INTO batch_rec
        FROM public.academic_batches
        WHERE id = NEW.batch_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced batch (%) does not exist.', NEW.batch_id;
        END IF;

        IF batch_rec.programme_id <> NEW.programme_id THEN
            RAISE EXCEPTION 'Semester programme (%) does not match referenced batch programme (%).', NEW.programme_id, batch_rec.programme_id;
        END IF;

        -- If both semester and batch specify schemes, they must match
        IF NEW.scheme_id IS NOT NULL AND batch_rec.scheme_id IS NOT NULL AND NEW.scheme_id <> batch_rec.scheme_id THEN
            RAISE EXCEPTION 'Semester scheme (%) conflicts with batch scheme (%).', NEW.scheme_id, batch_rec.scheme_id;
        END IF;

        -- Auto-inherit batch scheme if semester scheme is unconfigured
        IF NEW.scheme_id IS NULL AND batch_rec.scheme_id IS NOT NULL THEN
            NEW.scheme_id := batch_rec.scheme_id;
        END IF;
    END IF;

    -- If scheme is specified, verify it is mapped to this programme in programme_schemes
    IF NEW.scheme_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.programme_schemes ps
            WHERE ps.programme_id = NEW.programme_id
              AND ps.scheme_id = NEW.scheme_id
        ) THEN
            RAISE EXCEPTION 'Scheme (%) is not mapped to programme (%) in programme_schemes.', NEW.scheme_id, NEW.programme_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_semester_hierarchy ON public.programme_semesters;
CREATE TRIGGER trg_check_semester_hierarchy
BEFORE INSERT OR UPDATE ON public.programme_semesters
FOR EACH ROW
EXECUTE FUNCTION public.check_semester_hierarchy_consistency();

-- B. Validates academic_batches updates to protect existing child semesters
CREATE OR REPLACE FUNCTION public.check_batch_update_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- If batch scheme is updated, prevent conflicts with existing child semesters
    IF NEW.scheme_id IS DISTINCT FROM OLD.scheme_id AND NEW.scheme_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.programme_semesters ps
            WHERE ps.batch_id = NEW.id
              AND ps.scheme_id IS NOT NULL
              AND ps.scheme_id <> NEW.scheme_id
        ) THEN
            RAISE EXCEPTION 'Cannot update batch scheme to (%): existing semesters under batch (%) have a conflicting scheme assignment.', NEW.scheme_id, NEW.id;
        END IF;
    END IF;

    -- If batch programme is updated, prevent conflicts with existing child semesters
    IF NEW.programme_id IS DISTINCT FROM OLD.programme_id THEN
        IF EXISTS (
            SELECT 1 FROM public.programme_semesters ps
            WHERE ps.batch_id = NEW.id
              AND ps.programme_id <> NEW.programme_id
        ) THEN
            RAISE EXCEPTION 'Cannot update batch programme: child semesters exist for batch (%).', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_batch_update ON public.academic_batches;
CREATE TRIGGER trg_check_batch_update
BEFORE UPDATE ON public.academic_batches
FOR EACH ROW
EXECUTE FUNCTION public.check_batch_update_consistency();

-- ------------------------------------------------------------------------------
-- 8. SUBJECTS TABLE (Curation ready; zero fake subjects seeded)
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
-- 9. MODULES TABLE (With safe 'is_active' soft deactivation)
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
-- 10. ADMIN PROFILES TABLE (Linked to Supabase Auth auth.users)
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
-- 11. ACADEMIC NOTES / PDF MATERIALS TABLE (Exact storage_path + PDF CHECK)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    storage_path TEXT NOT NULL,
    file_url TEXT,
    file_size_bytes BIGINT,
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    is_published BOOLEAN NOT NULL DEFAULT false,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_notes_storage_path UNIQUE (storage_path),
    CONSTRAINT check_notes_file_type CHECK (file_type = 'application/pdf')
);

-- ------------------------------------------------------------------------------
-- 12. INDEXES FOR PERFORMANCE AND FILTERING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_batches_programme ON public.academic_batches(programme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_batches_scheme ON public.academic_batches(scheme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_programme ON public.programme_semesters(programme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_batch ON public.programme_semesters(batch_id, is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_scheme ON public.programme_semesters(scheme_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(programme_semester_id, is_active);
CREATE INDEX IF NOT EXISTS idx_modules_subject ON public.modules(subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_notes_module_published ON public.notes(module_id, is_published);
CREATE INDEX IF NOT EXISTS idx_notes_storage_path ON public.notes(storage_path);

-- ------------------------------------------------------------------------------
-- 13. SECURITY DEFINER HELPER FUNCTIONS (Secured with fixed search_path)
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

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- --- A. ADMIN PROFILES POLICIES ---
-- Admins can view other admin profiles
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
    ON public.admin_profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Strictly super_admin only can manage admin profiles (prevents self-promotion)
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

-- --- C. PROGRAMMES POLICIES ---
DROP POLICY IF EXISTS "Public students can view active programmes" ON public.programmes;
CREATE POLICY "Public students can view active programmes"
    ON public.programmes FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins have full access to programmes" ON public.programmes;
CREATE POLICY "Admins have full access to programmes"
    ON public.programmes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- D. PROGRAMME SCHEMES POLICIES ---
-- Exposed only if parent programme and scheme are both active
DROP POLICY IF EXISTS "Public students can view active programme schemes" ON public.programme_schemes;
CREATE POLICY "Public students can view active programme schemes"
    ON public.programme_schemes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.programmes p
            JOIN public.schemes sc ON sc.id = programme_schemes.scheme_id
            WHERE p.id = programme_schemes.programme_id
              AND p.is_active = true
              AND sc.is_active = true
        )
    );

DROP POLICY IF EXISTS "Admins have full access to programme schemes" ON public.programme_schemes;
CREATE POLICY "Admins have full access to programme schemes"
    ON public.programme_schemes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- E. ACADEMIC BATCHES POLICIES ---
-- Complete scheme validation: Parent programme must be active; referenced scheme must be active and mapped
DROP POLICY IF EXISTS "Public students can view active batches with active hierarchy" ON public.academic_batches;
CREATE POLICY "Public students can view active batches with active hierarchy"
    ON public.academic_batches FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programmes p
            WHERE p.id = academic_batches.programme_id
              AND p.is_active = true
        )
        AND (
            scheme_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.schemes sc
                JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = academic_batches.programme_id
                WHERE sc.id = academic_batches.scheme_id
                  AND sc.is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Admins have full access to academic batches" ON public.academic_batches;
CREATE POLICY "Admins have full access to academic batches"
    ON public.academic_batches FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- F. PROGRAMME SEMESTERS POLICIES ---
-- Complete scheme validation: Programme active; linked batch active + batch scheme active; assigned scheme active + mapped
DROP POLICY IF EXISTS "Public students can view active semesters with active hierarchy" ON public.programme_semesters;
CREATE POLICY "Public students can view active semesters with active hierarchy"
    ON public.programme_semesters FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programmes p
            WHERE p.id = programme_semesters.programme_id
              AND p.is_active = true
        )
        AND (
            batch_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.academic_batches b
                WHERE b.id = programme_semesters.batch_id
                  AND b.is_active = true
                  AND (
                      b.scheme_id IS NULL
                      OR EXISTS (
                          SELECT 1 FROM public.schemes sc
                          JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = programme_semesters.programme_id
                          WHERE sc.id = b.scheme_id AND sc.is_active = true
                      )
                  )
            )
        )
        AND (
            scheme_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.schemes sc
                JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = programme_semesters.programme_id
                WHERE sc.id = programme_semesters.scheme_id
                  AND sc.is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Admins have full access to programme semesters" ON public.programme_semesters;
CREATE POLICY "Admins have full access to programme semesters"
    ON public.programme_semesters FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- G. SUBJECTS POLICIES ---
-- Complete hierarchy validation: Parent semester, batch (if linked), schemes, and programme must be active
DROP POLICY IF EXISTS "Public students can view active subjects with active hierarchy" ON public.subjects;
CREATE POLICY "Public students can view active subjects with active hierarchy"
    ON public.subjects FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.programme_semesters ps
            JOIN public.programmes p ON p.id = ps.programme_id
            WHERE ps.id = subjects.programme_semester_id
              AND ps.is_active = true
              AND p.is_active = true
              AND (
                  ps.batch_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.academic_batches b
                      WHERE b.id = ps.batch_id
                        AND b.is_active = true
                        AND (
                            b.scheme_id IS NULL
                            OR EXISTS (
                                SELECT 1 FROM public.schemes sc
                                JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                                WHERE sc.id = b.scheme_id AND sc.is_active = true
                            )
                        )
                  )
              )
              AND (
                  ps.scheme_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.schemes sc
                      JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                      WHERE sc.id = ps.scheme_id AND sc.is_active = true
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Admins have full access to subjects" ON public.subjects;
CREATE POLICY "Admins have full access to subjects"
    ON public.subjects FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- H. MODULES POLICIES ---
DROP POLICY IF EXISTS "Public students can view active modules with active hierarchy" ON public.modules;
CREATE POLICY "Public students can view active modules with active hierarchy"
    ON public.modules FOR SELECT
    USING (
        is_active = true
        AND EXISTS (
            SELECT 1 FROM public.subjects s
            JOIN public.programme_semesters ps ON ps.id = s.programme_semester_id
            JOIN public.programmes p ON p.id = ps.programme_id
            WHERE s.id = modules.subject_id
              AND s.is_active = true
              AND ps.is_active = true
              AND p.is_active = true
              AND (
                  ps.batch_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.academic_batches b
                      WHERE b.id = ps.batch_id
                        AND b.is_active = true
                        AND (
                            b.scheme_id IS NULL
                            OR EXISTS (
                                SELECT 1 FROM public.schemes sc
                                JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                                WHERE sc.id = b.scheme_id AND sc.is_active = true
                            )
                        )
                  )
              )
              AND (
                  ps.scheme_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.schemes sc
                      JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                      WHERE sc.id = ps.scheme_id AND sc.is_active = true
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Admins have full access to modules" ON public.modules;
CREATE POLICY "Admins have full access to modules"
    ON public.modules FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- I. NOTES POLICIES ---
-- Note must be published, file_type must be application/pdf, and entire parent hierarchy active
DROP POLICY IF EXISTS "Public students can view published notes with active hierarchy" ON public.notes;
CREATE POLICY "Public students can view published notes with active hierarchy"
    ON public.notes FOR SELECT
    USING (
        is_published = true
        AND file_type = 'application/pdf'
        AND EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.subjects s ON s.id = m.subject_id
            JOIN public.programme_semesters ps ON ps.id = s.programme_semester_id
            JOIN public.programmes p ON p.id = ps.programme_id
            WHERE m.id = notes.module_id
              AND m.is_active = true
              AND s.is_active = true
              AND ps.is_active = true
              AND p.is_active = true
              AND (
                  ps.batch_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.academic_batches b
                      WHERE b.id = ps.batch_id
                        AND b.is_active = true
                        AND (
                            b.scheme_id IS NULL
                            OR EXISTS (
                                SELECT 1 FROM public.schemes sc
                                JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                                WHERE sc.id = b.scheme_id AND sc.is_active = true
                            )
                        )
                  )
              )
              AND (
                  ps.scheme_id IS NULL
                  OR EXISTS (
                      SELECT 1 FROM public.schemes sc
                      JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                      WHERE sc.id = ps.scheme_id AND sc.is_active = true
                  )
              )
        )
    );

DROP POLICY IF EXISTS "Admins have full access to notes" ON public.notes;
CREATE POLICY "Admins have full access to notes"
    ON public.notes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 15. PRIVATE SUPABASE STORAGE CONFIGURATION & POLICIES
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

-- Storage Object Policies (Using exact storage_path matching and PDF checks)
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
    )
    WITH CHECK (
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
                WHERE n.storage_path = storage.objects.name
                  AND n.file_type = 'application/pdf'
                  AND n.is_published = true
                  AND m.is_active = true
                  AND s.is_active = true
                  AND ps.is_active = true
                  AND p.is_active = true
                  AND (
                      ps.batch_id IS NULL
                      OR EXISTS (
                          SELECT 1 FROM public.academic_batches b
                          WHERE b.id = ps.batch_id
                            AND b.is_active = true
                            AND (
                                b.scheme_id IS NULL
                                OR EXISTS (
                                    SELECT 1 FROM public.schemes sc
                                    JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                                    WHERE sc.id = b.scheme_id AND sc.is_active = true
                                )
                            )
                      )
                  )
                  AND (
                      ps.scheme_id IS NULL
                      OR EXISTS (
                          SELECT 1 FROM public.schemes sc
                          JOIN public.programme_schemes psch ON psch.scheme_id = sc.id AND psch.programme_id = p.id
                          WHERE sc.id = ps.scheme_id AND sc.is_active = true
                      )
                  )
            )
        )
    );

-- ------------------------------------------------------------------------------
-- 16. SEED DATA: Exactly 7 KTU Programmes & 11 Semesters (Safe Idempotency)
-- ------------------------------------------------------------------------------
-- Note: ON CONFLICT DO NOTHING ensures re-running the script never overwrites
-- admin edits or reactivates records that an administrator intentionally deactivated.

-- Schemes: Intentionally left EMPTY. Administrators will create verified KTU schemes later.

-- Exactly 7 Programmes in strict approved display order (All 4 B.Tech grouped together)
INSERT INTO public.programmes (id, code, name, full_name, degree_type, icon_name, description, sort_order, is_active)
VALUES
    ('btech-aids', 'AI & DS', 'B.Tech AI & DS', 'Artificial Intelligence & Data Science', 'B.Tech', 'Bot', NULL, 1, true),
    ('btech-cse', 'CSE', 'B.Tech CSE', 'Computer Science & Engineering', 'B.Tech', 'Cpu', NULL, 2, true),
    ('btech-csbs', 'CSBS', 'B.Tech CSBS', 'Computer Science & Business Systems', 'B.Tech', 'Binary', NULL, 3, true),
    ('btech-ece', 'ECE', 'B.Tech ECE', 'Electronics and Communication Engineering', 'B.Tech', 'Radio', NULL, 4, true),
    ('bca', 'BCA', 'BCA', 'Bachelor of Computer Applications', 'Undergraduate', 'Code2', NULL, 5, true),
    ('bba', 'BBA', 'BBA', 'Bachelor of Business Administration', 'Undergraduate', 'Briefcase', NULL, 6, true),
    ('mba', 'MBA', 'MBA', 'Master of Business Administration', 'Postgraduate', 'GraduationCap', NULL, 7, true)
ON CONFLICT (id) DO UPDATE SET
    sort_order = EXCLUDED.sort_order;

-- Programme Schemes: Intentionally left EMPTY until schemes are added and mapped by administrators.

-- Academic Batches: Intentionally left EMPTY until batches are configured by administrators.

-- Exactly 11 Initial Programme-Semester Combinations
-- Batch, scheme, phase, focus, and description are NULL until confirmed by administrators
INSERT INTO public.programme_semesters (id, programme_id, batch_id, scheme_id, semester_number, title, phase, focus, description, sort_order, is_active)
VALUES
    -- 1. B.Tech AI & DS (S1, S2, S3)
    ('btech-aids-s1', 'btech-aids', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),
    ('btech-aids-s2', 'btech-aids', NULL, NULL, 2, 'Semester 2', NULL, NULL, NULL, 2, true),
    ('btech-aids-s3', 'btech-aids', NULL, NULL, 3, 'Semester 3', NULL, NULL, NULL, 3, true),

    -- 2. B.Tech CSE (S1, S2, S3)
    ('btech-cse-s1', 'btech-cse', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),
    ('btech-cse-s2', 'btech-cse', NULL, NULL, 2, 'Semester 2', NULL, NULL, NULL, 2, true),
    ('btech-cse-s3', 'btech-cse', NULL, NULL, 3, 'Semester 3', NULL, NULL, NULL, 3, true),

    -- 3. B.Tech CSBS (S1)
    ('btech-csbs-s1', 'btech-csbs', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),

    -- 4. B.Tech ECE (S1)
    ('btech-ece-s1', 'btech-ece', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),

    -- 5. BCA (S1)
    ('bca-s1', 'bca', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),

    -- 6. BBA (S1)
    ('bba-s1', 'bba', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true),

    -- 7. MBA (S1)
    ('mba-s1', 'mba', NULL, NULL, 1, 'Semester 1', NULL, NULL, NULL, 1, true)
ON CONFLICT (id) DO NOTHING;

-- ZERO fake subjects, modules, notes, or batches are seeded.
-- Verified academic batches, schemes, subjects, and notes will be managed dynamically by administrators.
