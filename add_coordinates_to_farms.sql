-- Add coordinates column to farms table
ALTER TABLE farms ADD COLUMN IF NOT EXISTS coordinates text;

-- Optional: Add a comment
COMMENT ON COLUMN farms.coordinates IS 'JSON string of farm center coordinates [lat, lng]';
