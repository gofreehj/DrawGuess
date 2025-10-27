-- Enable Row Level Security for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile (auto-created on first login)
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON user_profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- Policy: Allow service role to manage all profiles (for admin operations)
CREATE POLICY "Service role can manage all profiles" ON user_profiles
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');