import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function extractStoragePath(publicUrl: string, bucketName: string): string | null {
  const pattern = new RegExp(`/storage/v1/object/public/${bucketName}/(.+)$`);
  const match = publicUrl.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

export function useSignedUrl(
  publicUrl: string | null,
  bucket: string = "user-documents",
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!publicUrl) {
      setSignedUrl(null);
      return;
    }

    const path = extractStoragePath(publicUrl, bucket);
    if (!path) {
      setSignedUrl(publicUrl);
      return;
    }

    supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
      .then(({ data, error }) => {
        if (error || !data?.signedUrl) {
          console.warn("Failed to create signed URL, falling back to public URL", error);
          setSignedUrl(publicUrl);
        } else {
          setSignedUrl(data.signedUrl);
        }
      });
  }, [publicUrl, bucket, expiresIn]);

  return signedUrl;
}
