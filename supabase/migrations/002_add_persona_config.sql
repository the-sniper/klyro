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
    ALTER TABLE widgets ADD CONSTRAINT widgets_communication_style_check 
      CHECK (communication_style IN ('formal', 'casual', 'friendly', 'professional'));
  END IF;
END $$;

-- Custom instructions for additional persona customization
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS custom_instructions text;

-- Add comment for documentation
COMMENT ON COLUMN widgets.owner_name IS 'The portfolio owner''s name for first-person AI responses';
COMMENT ON COLUMN widgets.personality_traits IS 'Array of personality traits like friendly, technical, enthusiastic';
COMMENT ON COLUMN widgets.communication_style IS 'Tone: formal, casual, friendly, or professional';
COMMENT ON COLUMN widgets.custom_instructions IS 'Custom instructions to shape AI persona';
