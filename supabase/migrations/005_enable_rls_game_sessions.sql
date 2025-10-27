-- Enable Row Level Security for game_sessions table
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own game sessions and anonymous sessions
CREATE POLICY "Users can view own games and anonymous games" ON game_sessions
    FOR SELECT 
    USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Users can insert their own game sessions and anonymous sessions
CREATE POLICY "Users can insert own games and anonymous games" ON game_sessions
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Users can update their own game sessions
CREATE POLICY "Users can update own games" ON game_sessions
    FOR UPDATE 
    USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    )
    WITH CHECK (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Users can delete their own game sessions
CREATE POLICY "Users can delete own games" ON game_sessions
    FOR DELETE 
    USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Policy: Allow anonymous users to create anonymous game sessions
CREATE POLICY "Anonymous users can create anonymous games" ON game_sessions
    FOR INSERT 
    WITH CHECK (
        user_id IS NULL AND 
        auth.uid() IS NULL
    );

-- Policy: Allow anonymous users to view anonymous game sessions (for local history)
CREATE POLICY "Anonymous users can view anonymous games" ON game_sessions
    FOR SELECT 
    USING (
        user_id IS NULL AND 
        auth.uid() IS NULL
    );