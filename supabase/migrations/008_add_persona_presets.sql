-- Create persona presets table
CREATE TABLE persona_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tagline text,
  description text,
  avatar text,
  color text,
  communication_style text NOT NULL CHECK (communication_style IN ('formal', 'casual', 'friendly', 'professional', 'enthusiastic', 'calm')),
  personality_traits text[] NOT NULL DEFAULT '{}',
  is_system boolean DEFAULT true, -- System presets can't be deleted by users
  created_at timestamptz DEFAULT now()
);

-- Add selected_preset_id column to widgets table
ALTER TABLE widgets ADD COLUMN IF NOT EXISTS selected_preset_id uuid REFERENCES persona_presets(id) ON DELETE SET NULL;

-- Seed the three personas from the landing page
INSERT INTO persona_presets (name, tagline, description, avatar, color, communication_style, personality_traits)
VALUES 
  (
    'The Architect', 
    'Precise & Logistical', 
    'Specializes in technical architecture, system design, and deep-dive technical queries.', 
    '/images/avatars/architect_head.png', 
    '#3b82f6', 
    'formal', 
    ARRAY['technical', 'methodical', 'detail-oriented', 'independent']
  ),
  (
    'The Strategist', 
    'Results-Driven', 
    'Emphasizes market impact, project ROI, and long-term strategic value of your work.', 
    '/images/avatars/strategist_head.png', 
    '#f59e0b', 
    'professional', 
    ARRAY['confident', 'big-picture thinker', 'persuasive', 'leader']
  ),
  (
    'The Muse', 
    'Witty & Inspiring', 
    'Focuses on user experience, design philosophy, and creative storytelling of your journey.', 
    '/images/avatars/muse_head.png', 
    '#d946ef', 
    'friendly', 
    ARRAY['creative', 'curious', 'storyteller', 'empathetic']
  );

-- Create index for faster lookups
CREATE INDEX idx_persona_presets_is_system ON persona_presets(is_system);
