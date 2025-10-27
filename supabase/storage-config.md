# Supabase Storage Configuration

## Storage Bucket Setup

The `drawings` storage bucket is configured with the following settings:

### Bucket Configuration
- **Bucket ID**: `drawings`
- **Public Access**: `false` (private bucket)
- **File Size Limit**: `5MB` (5,242,880 bytes)
- **Allowed MIME Types**: 
  - `image/png`
  - `image/jpeg` 
  - `image/webp`

### Folder Structure
```
drawings/
├── {user_id}/           # Authenticated user drawings
│   └── {game_id}.png    # Individual game drawings
└── anonymous/           # Anonymous user drawings
    └── {game_id}.png    # Anonymous game drawings
```

### Access Policies

#### Upload Policy
- Authenticated users can upload to their own folder (`{user_id}/`)
- Anonymous users can upload to the `anonymous/` folder
- Service role can upload anywhere

#### View Policy
- Users can only view their own drawings
- Anonymous users can view anonymous drawings
- Service role can view all drawings

#### Update/Delete Policy
- Users can only modify their own drawings
- Anonymous users can modify anonymous drawings
- Service role can modify all drawings

### File Naming Convention
- Format: `{user_id|anonymous}/{game_id}.{extension}`
- Example authenticated: `550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000.png`
- Example anonymous: `anonymous/123e4567-e89b-12d3-a456-426614174000.png`

### Manual Configuration Steps

If the migrations don't automatically create the storage bucket, follow these steps in the Supabase dashboard:

1. **Create Bucket**:
   - Go to Storage > Buckets
   - Click "New bucket"
   - Name: `drawings`
   - Public: `false`
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/png,image/jpeg,image/webp`

2. **Configure Policies**:
   - The RLS policies are automatically created by the migration files
   - Verify policies are active in Storage > Policies

3. **Test Upload**:
   ```javascript
   // Test upload from client
   const { data, error } = await supabase.storage
     .from('drawings')
     .upload('test-user/test-game.png', file);
   ```

### Cleanup and Maintenance

- Anonymous drawings older than 30 days are automatically cleaned up
- Use the `cleanup_old_anonymous_drawings()` function for manual cleanup
- Monitor storage usage in the Supabase dashboard

### Security Considerations

- All drawings are private by default
- Access is controlled through RLS policies
- Signed URLs are used for temporary access
- File type validation prevents malicious uploads
- Size limits prevent storage abuse