-- Check all stages
SELECT * FROM stages;

-- Check expenses and their stage_ids
SELECT id, description, category, stage_id FROM expenses ORDER BY date DESC LIMIT 10;
