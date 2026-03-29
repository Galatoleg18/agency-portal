-- ============================================================
-- MIGRATIONS — run after initial schema.sql
-- ============================================================

-- Add phase due dates
ALTER TABLE phases ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add invoice number
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  actor_email TEXT NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL, -- 'comment_added', 'deliverable_approved', 'invoice_paid', 'phase_completed', 'task_completed', 'project_status_changed'
  subject TEXT,         -- human-readable description
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_project ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity: staff full access" ON activity_log FOR ALL USING (is_staff());
CREATE POLICY "activity: client reads own project activity" ON activity_log
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM projects p JOIN clients c ON c.id = p.client_id WHERE c.email = client_email()
    )
  );

-- ============================================================
-- PROJECT TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES project_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS template_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_phase_id UUID NOT NULL REFERENCES template_phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates: staff full access" ON project_templates FOR ALL USING (is_staff());
CREATE POLICY "template_phases: staff full access" ON template_phases FOR ALL USING (is_staff());
CREATE POLICY "template_tasks: staff full access" ON template_tasks FOR ALL USING (is_staff());

-- ============================================================
-- TIME ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
  logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  logged_by_email TEXT NOT NULL,
  description TEXT,
  minutes INTEGER NOT NULL DEFAULT 0,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_entries: staff full access" ON time_entries FOR ALL USING (is_staff());
