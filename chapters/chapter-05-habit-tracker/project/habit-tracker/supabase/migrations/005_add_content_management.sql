-- Create a content management data table
CREATE TABLE IF NOT EXISTS app_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add update time trigger
CREATE TRIGGER update_app_content_updated_at
  BEFORE UPDATE ON app_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Set row-level security policy (RLS)
ALTER TABLE app_content ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read content
CREATE POLICY "Anyone can view app content" ON app_content
  FOR SELECT USING (true);

-- Only administrator users are allowed to modify content (all authenticated users are temporarily allowed)
CREATE POLICY "Authenticated users can modify content" ON app_content
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert some sample content
INSERT INTO app_content (key, value, category) VALUES 
  ('page_title', 'Settings', 'settings'),
  ('profile_section_title', 'Profile', 'settings'),
  ('notification_section_title', 'Notifications', 'settings'),
  ('habits_page_title', 'My Habits', 'habits'),
  ('analytics_page_title', 'Analytics', 'analytics'),
  ('welcome_message', 'Welcome to Habit Tracker!', 'general'),
  ('footer_text', '© 2024 Habit Tracker. All rights reserved.', 'general')
ON CONFLICT (key) DO NOTHING;
