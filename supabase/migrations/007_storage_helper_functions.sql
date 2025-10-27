-- Helper function to generate drawing file paths
CREATE OR REPLACE FUNCTION generate_drawing_path(user_uuid UUID, game_id UUID, file_extension TEXT DEFAULT 'png')
RETURNS TEXT AS $$
BEGIN
    IF user_uuid IS NULL THEN
        RETURN 'anonymous/' || game_id::text || '.' || file_extension;
    ELSE
        RETURN user_uuid::text || '/' || game_id::text || '.' || file_extension;
    END IF;
END;
$$ language 'plpgsql';

-- Helper function to get signed URL for drawing
CREATE OR REPLACE FUNCTION get_drawing_signed_url(drawing_path TEXT, expires_in INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- This function would typically call Supabase's storage API
    -- For now, we'll return the path that can be used with the storage client
    RETURN 'drawings/' || drawing_path;
END;
$$ language 'plpgsql';

-- Function to clean up old anonymous drawings (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_drawings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old anonymous game sessions and their associated drawings
    WITH deleted_sessions AS (
        DELETE FROM game_sessions 
        WHERE user_id IS NULL 
        AND created_at < NOW() - INTERVAL '30 days'
        RETURNING drawing_url
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_sessions;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create a scheduled job to clean up old anonymous data (if pg_cron is available)
-- This would typically be set up in the Supabase dashboard or via SQL
-- SELECT cron.schedule('cleanup-anonymous-drawings', '0 2 * * *', 'SELECT cleanup_old_anonymous_drawings();');