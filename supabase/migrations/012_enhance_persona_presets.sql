-- Enhance persona presets with more distinctive traits and styles
-- This makes each persona sound genuinely different

-- Update The Muse to be more witty and inspiring (matching its tagline)
UPDATE persona_presets 
SET 
  communication_style = 'enthusiastic',
  personality_traits = ARRAY['creative', 'curious', 'storyteller', 'empathetic', 'witty', 'inspiring', 'humorous']
WHERE name = 'The Muse';

-- Update The Strategist to have bolder traits (Results-Driven)
UPDATE persona_presets 
SET 
  communication_style = 'professional',
  personality_traits = ARRAY['confident', 'big-picture thinker', 'persuasive', 'leader', 'analytical']
WHERE name = 'The Strategist';

-- Update The Architect to be more distinct (Precise & Logistical)
UPDATE persona_presets 
SET 
  communication_style = 'formal',
  personality_traits = ARRAY['technical', 'methodical', 'detail-oriented', 'independent', 'analytical']
WHERE name = 'The Architect';
