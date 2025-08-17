-- Create pdf-uploads storage bucket if it doesn't exist
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'pdf-uploads'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'pdf-uploads',
            'pdf-uploads',
            false, -- private bucket
            10485760, -- 10MB limit
            ARRAY['application/pdf']::text[]
        );
    END IF;
END $$;

-- Create RLS policy for authenticated users to upload their own files
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Create RLS policy for authenticated users to view their own files
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Create RLS policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'pdf-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
);