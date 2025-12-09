-- Add agromonitoring_id column to zones table to store the external polygon ID
ALTER TABLE zones 
ADD COLUMN agromonitoring_id text;
