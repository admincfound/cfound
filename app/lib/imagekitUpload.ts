// lib/imagekitUpload.ts
// Client-side direct upload to ImageKit using the app's /api/imagekit/auth endpoint
// for signed upload credentials. No Firebase Storage involved.

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  filePath: string;
}

interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
}

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

/**
 * Uploads a file directly to ImageKit from the browser.
 * Fetches fresh auth params from /api/imagekit/auth right before uploading
 * (tokens are short-lived and must not be reused/cached).
 *
 * @param file        The file/blob to upload.
 * @param fileName    Desired file name on ImageKit (e.g. `${uid}-${Date.now()}`).
 * @param folder      Destination folder, e.g. "profile-photos".
 * @param onProgress  Optional callback invoked with 0-100 as upload progresses.
 */
export async function uploadToImageKit(
  file: File | Blob,
  fileName: string,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<ImageKitUploadResult> {
  // 1. Get fresh signed auth params from our own backend route.
  const authRes = await fetch('/api/imagekit/auth', { cache: 'no-store' });
  if (!authRes.ok) {
    throw new Error('Failed to get upload authentication.');
  }
  const auth: ImageKitAuthResponse = await authRes.json();

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('Missing NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY.');
  }

  // 2. Build the multipart form body required by ImageKit's upload API.
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('publicKey', publicKey);
  formData.append('signature', auth.signature);
  formData.append('expire', String(auth.expire));
  formData.append('token', auth.token);
  formData.append('useUniqueFileName', 'false');

  // 3. Use XHR (not fetch) so we get real upload progress events.
  return new Promise<ImageKitUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', IMAGEKIT_UPLOAD_URL);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: response.url,
            fileId: response.fileId,
            name: response.name,
            filePath: response.filePath,
          });
        } else {
          reject(new Error(response?.message || 'ImageKit upload failed.'));
        }
      } catch {
        reject(new Error('Failed to parse ImageKit response.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}

/**
 * Best-effort deletion of a previously uploaded ImageKit file.
 * Deletion requires the private key, so this calls our own backend route
 * (/api/imagekit/delete) rather than ImageKit directly. This is intentionally
 * "fire and forget" from the caller's perspective: if the route doesn't exist
 * yet, or the delete fails for any reason (file already gone, network error,
 * etc.), the caller should treat it as non-fatal and proceed — losing track of
 * an orphaned file is preferable to blocking the user's save.
 *
 * @param fileUrl  The ImageKit file URL previously returned from uploadToImageKit.
 */
export async function deleteFromImageKit(fileUrl: string): Promise<boolean> {
  if (!fileUrl) return false;
  try {
    const res = await fetch('/api/imagekit/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fileUrl }),
    });
    return res.ok;
  } catch {
    // Network failure or endpoint missing — non-fatal, caller proceeds.
    return false;
  }
}