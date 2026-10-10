-- 1. View files (SELECT): Allow anyone to read the images
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'item-images');

-- 2. Upload files (INSERT): Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'item-images');

-- 3. Replace files (UPDATE): Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid() = owner);

-- 4. Delete files (DELETE): Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'item-images' AND auth.uid() = owner);