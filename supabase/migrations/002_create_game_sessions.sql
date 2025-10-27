-- Create game_sessions table for game record storage
CREATE TABLE game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  prompt_category TEXT NOT NULL,
  drawing_url TEXT,
  ai_guess TEXT,
  confidence DECIMAL(5,2),
  is_correct BOOLEAN,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  CONSTRAINT valid_duration CHECK (duration IS NULL OR duration >= 0),
  CONSTRAINT valid_time_order CHECK (end_time IS NULL OR end_time >= start_time),
  CONSTRAINT prompt_not_empty CHECK (LENGTH(TRIM(prompt)) > 0),
  CONSTRAINT category_not_empty CHECK (LENGTH(TRIM(prompt_category)) > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at DESC);
CREATE INDEX idx_game_sessions_prompt_category ON game_sessions(prompt_category);
CREATE INDEX idx_game_sessions_is_correct ON game_sessions(is_correct);
CREATE INDEX idx_game_sessions_user_created ON game_sessions(user_id, created_at DESC);

-- Create function to automatically calculate duration when end_time is set
CREATE OR REPLACE FUNCTION calculate_game_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically calculate duration
CREATE TRIGGER calculate_game_sessions_duration 
    BEFORE INSERT OR UPDATE ON game_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_game_duration();