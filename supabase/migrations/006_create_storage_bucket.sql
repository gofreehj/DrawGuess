-- Create storage bucket for drawings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'drawings',
    'drawings',
    false, -- Private bucket, access controlled by policies
    5242880, -- 5MB file size limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
);

-- Enable RLS for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload drawings to their own folder
CREATE POLICY "Users can upload own drawings" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'drawings' AND 
        (
            -- Authenticated users can upload to their own folder
            (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
            -- Anonymous users can upload to 'anonymous' folder
            (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
            -- Service role can upload anywhere
            auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Policy: Users can view their own drawings and anonymous drawings
CREATE POLICY "Users can view own drawings" ON storage.objects
    FOR SELECT 
    USING (
        bucket_id = 'drawings' AND 
        (
            -- Authenticated users can view their own drawings
            (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
            -- Anonymous users can view anonymous drawings
            (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
            -- Service role can view all
            auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Policy: Users can update their own drawings
CREATE POLICY "Users can update own drawings" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'drawings' AND 
        (
            (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
            (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
            auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Policy: Users can delete their own drawings
CREATE POLICY "Users can delete own drawings" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'drawings' AND 
        (
            (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]) OR
            (auth.uid() IS NULL AND (storage.foldername(name))[1] = 'anonymous') OR
            auth.jwt() ->> 'role' = 'service_role'
        )
    );