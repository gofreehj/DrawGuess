-- Create function to update user profile statistics when game sessions change
CREATE OR REPLACE FUNCTION update_user_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    user_uuid UUID;
    total_count INTEGER;
    success_count INTEGER;
    avg_conf DECIMAL(5,2);
BEGIN
    -- Determine which user_id to update based on the operation
    IF TG_OP = 'DELETE' THEN
        user_uuid := OLD.user_id;
    ELSE
        user_uuid := NEW.user_id;
    END IF;
    
    -- Skip if no user_id (anonymous games)
    IF user_uuid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate updated statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_correct = true),
        AVG(confidence) FILTER (WHERE confidence IS NOT NULL)
    INTO total_count, success_count, avg_conf
    FROM game_sessions 
    WHERE user_id = user_uuid;
    
    -- Update user profile with new statistics
    INSERT INTO user_profiles (id, total_games, successful_games, average_confidence)
    VALUES (user_uuid, total_count, success_count, COALESCE(avg_conf, 0))
    ON CONFLICT (id) 
    DO UPDATE SET 
        total_games = EXCLUDED.total_games,
        successful_games = EXCLUDED.successful_games,
        average_confidence = EXCLUDED.average_confidence,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to automatically update user statistics
CREATE TRIGGER update_user_stats_on_insert 
    AFTER INSERT ON game_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_profile_stats();

CREATE TRIGGER update_user_stats_on_update 
    AFTER UPDATE ON game_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_profile_stats();

CREATE TRIGGER update_user_stats_on_delete 
    AFTER DELETE ON game_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_profile_stats();

-- Create function to get user game statistics
CREATE OR REPLACE FUNCTION get_user_game_stats(user_uuid UUID)
RETURNS TABLE (
    total_games INTEGER,
    successful_games INTEGER,
    success_rate DECIMAL(5,2),
    average_confidence DECIMAL(5,2),
    games_this_week INTEGER,
    games_this_month INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.total_games,
        up.successful_games,
        CASE 
            WHEN up.total_games > 0 THEN ROUND((up.successful_games::DECIMAL / up.total_games * 100), 2)
            ELSE 0.00
        END as success_rate,
        up.average_confidence,
        (SELECT COUNT(*)::INTEGER FROM game_sessions 
         WHERE user_id = user_uuid 
         AND created_at >= DATE_TRUNC('week', NOW())) as games_this_week,
        (SELECT COUNT(*)::INTEGER FROM game_sessions 
         WHERE user_id = user_uuid 
         AND created_at >= DATE_TRUNC('month', NOW())) as games_this_month
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ language 'plpgsql';