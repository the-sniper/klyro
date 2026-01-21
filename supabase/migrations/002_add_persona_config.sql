-- Add persona configuration columns to widgets table for more natural AI responses

-- Owner's name for first-person references
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS owner_name text;

-- Personality traits array (e.g., 'friendly', 'technical', 'enthusiastic', 'humble')
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS personality_traits text[] DEFAULT '{}';

-- Communication style preference
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'widgets' AND column_name = 'communication_style'
  ) THEN
    ALTER TABLE widgets ADD COLUMN communication_style text DEFAULT 'friendly';
  END IF;
END $$;

-- Custom instructions for additional persona customization
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS custom_instructions text;

-- External links the bot can share (GitHub, LinkedIn, Twitter, etc.)
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS external_links jsonb DEFAULT '{}';

-- Access permissions for what the bot can discuss/share
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS access_permissions jsonb DEFAULT '{"can_share_github": true, "can_share_linkedin": true, "can_share_twitter": true, "can_share_email": true, "can_discuss_salary": false, "can_schedule_calls": true}';

-- Update the communication_style constraint to include new options
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_communication_style_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_communication_style_check 
  CHECK (communication_style IN ('formal', 'casual', 'friendly', 'professional', 'enthusiastic', 'calm'));

-- Add comments for documentation
COMMENT ON COLUMN widgets.owner_name IS 'The portfolio owner''s name for first-person AI responses';
COMMENT ON COLUMN widgets.personality_traits IS 'Array of personality traits like friendly, technical, enthusiastic';
COMMENT ON COLUMN widgets.communication_style IS 'Tone: formal, casual, friendly, professional, enthusiastic, or calm';
COMMENT ON COLUMN widgets.custom_instructions IS 'Custom instructions to shape AI persona';
COMMENT ON COLUMN widgets.external_links IS 'JSON object with external profile URLs (github, linkedin, twitter, website)';
COMMENT ON COLUMN widgets.access_permissions IS 'JSON object defining what the bot is allowed to share or discuss';

