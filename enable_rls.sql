-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milling_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

-- 1. Farms (Direct user_id)
CREATE POLICY "Users can view their own farms" ON farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own farms" ON farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own farms" ON farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own farms" ON farms FOR DELETE USING (auth.uid() = user_id);

-- 2. Zones (Direct user_id)
CREATE POLICY "Users can view their own zones" ON zones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own zones" ON zones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own zones" ON zones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own zones" ON zones FOR DELETE USING (auth.uid() = user_id);

-- 3. Cycles (Direct user_id)
CREATE POLICY "Users can view their own cycles" ON cycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cycles" ON cycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cycles" ON cycles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cycles" ON cycles FOR DELETE USING (auth.uid() = user_id);

-- 4. Expenses (Direct user_id)
CREATE POLICY "Users can view their own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- 5. Categories (Direct user_id)
-- Note: You might already have these, but running this is safe (it might error if exists, or you can drop first)
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- 6. Tasks (Direct user_id)
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- 7. Milling Records (Linked via cycle_id)
CREATE POLICY "Users can view their own milling records" ON milling_records FOR SELECT USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own milling records" ON milling_records FOR INSERT WITH CHECK (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update their own milling records" ON milling_records FOR UPDATE USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own milling records" ON milling_records FOR DELETE USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);

-- 8. Cycle Stage History (Linked via cycle_id)
CREATE POLICY "Users can view their own stage history" ON cycle_stage_history FOR SELECT USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert their own stage history" ON cycle_stage_history FOR INSERT WITH CHECK (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
-- Usually history is append-only, but allowing update/delete for owner is fine
CREATE POLICY "Users can update their own stage history" ON cycle_stage_history FOR UPDATE USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete their own stage history" ON cycle_stage_history FOR DELETE USING (
  cycle_id IN (SELECT id FROM cycles WHERE user_id = auth.uid())
);

-- 9. Stages (Shared/System table)
-- Since stages has no user_id, we allow all authenticated users to read.
-- If you want to restrict editing to admins, you'd need a role check. 
-- For now, consistent with your app logic, we allow auth users to modify (reset) them.
CREATE POLICY "Authenticated users can view stages" ON stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stages" ON stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update stages" ON stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stages" ON stages FOR DELETE TO authenticated USING (true);
