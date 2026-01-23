-- Add allowed_routes column to widgets table for page-level visibility control
-- This allows users to specify which pages/routes the widget should display on

ALTER TABLE widgets ADD COLUMN IF NOT EXISTS allowed_routes text[] DEFAULT '{}';

-- Add helpful comment explaining the field
COMMENT ON COLUMN widgets.allowed_routes IS 'Array of route patterns where the widget should be displayed. Empty array means show everywhere. Examples: ["/", "/about", "/contact/*"]';
