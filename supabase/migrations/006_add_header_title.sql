-- Add header_title column to widgets table for customizable chat header
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS header_title text DEFAULT 'Chat Assistant';

-- Update existing widgets to have the default header title
UPDATE widgets SET header_title = 'Chat Assistant' WHERE header_title IS NULL;
