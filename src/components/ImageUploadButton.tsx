import { useRef, useState } from 'react';
import { ImageUp, LoaderCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { authenticatedFetch } from '../services/apiClient';

interface ImageUploadButtonProps {
  onUploaded: (url: string) => void;
  compact?: boolean;
}

export const ImageUploadButton = ({ onUploaded, compact = false }: ImageUploadButtonProps) => {
  const { user, capabilities } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!user) {
      alert('Sign in to upload images. Guest mode can still use an existing image URL.');
      return;
    }
    if (!capabilities.cloudinaryConfigured) {
      alert('Cloudinary is not configured yet. Add its credentials to .env.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await authenticatedFetch('/api/uploads/image', { method: 'POST', body: formData });
      const body = await response.json() as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error || 'Upload failed.');
      onUploaded(body.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] disabled:opacity-60 ${compact ? 'p-2.5' : 'px-3 py-2.5 text-sm'}`} title={user ? 'Upload image to Cloudinary' : 'Sign in to upload; image URLs still work'}>
        {uploading ? <LoaderCircle className="animate-spin" size={17} /> : <ImageUp size={17} />}
        {!compact && <span>{uploading ? 'Uploading' : 'Upload'}</span>}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(event) => void handleUpload(event.target.files?.[0])} className="hidden" />
    </>
  );
};
