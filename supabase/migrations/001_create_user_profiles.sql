-- Create user_profiles table for user profile management
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  total_games INTEGER DEFAULT 0 NOT NULL,
  successful_games INTEGER DEFAULT 0 NOT NULL,
  average_confidence DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_total_games CHECK (total_games >= 0),
  CONSTRAINT valid_successful_games CHECK (successful_games >= 0),
  CONSTRAINT valid_success_rate CHECK (successful_games <= total_games),
  CONSTRAINT valid_confidence CHECK (average_confidence >= 0 AND average_confidence <= 100)
);

-- Create index for faster queries
CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();