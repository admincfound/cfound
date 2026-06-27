// app/api/imagekit/delete/route.ts
// Server-side endpoint that deletes a previously uploaded ImageKit file.
// Must run server-side because it uses IMAGEKIT_PRIVATE_KEY, which must never
// be exposed to the browser.
import { NextRequest, NextResponse } from 'next/server';

const IMAGEKIT_API_BASE = 'https://api.imagekit.io/v1';

function authHeader(): string {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  // ImageKit's management API uses HTTP Basic auth with the private key as the
  // username and an empty password.
  return 'Basic ' + Buffer.from(`${privateKey}:`).toString('base64');
}

/**
 * Given a public ImageKit file URL, resolves the corresponding fileId by
 * querying the management API for files whose path matches the URL's path.
 */
async function resolveFileId(fileUrl: string): Promise<string | null> {
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || '';
  if (!urlEndpoint || !fileUrl.startsWith(urlEndpoint)) return null;

  // Path relative to the URL endpoint, e.g. "/profile-photos/uid-12345"
  const filePath = fileUrl.slice(urlEndpoint.length).split('?')[0];
  const fileName = filePath.split('/').pop();
  if (!fileName) return null;

  const searchParams = new URLSearchParams({
    name: fileName,
    limit: '5',
  });

  const res = await fetch(`${IMAGEKIT_API_BASE}/files?${searchParams.toString()}`, {
    headers: { Authorization: authHeader() },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const files = await res.json();
  if (!Array.isArray(files)) return null;

  // Prefer an exact filePath match in case multiple files share a name.
  const match = files.find((f: any) => f.filePath === filePath) || files[0];
  return match?.fileId || null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url.' }, { status: 400 });
    }

    const fileId = await resolveFileId(url);
    if (!fileId) {
      // Nothing to delete (already gone, or URL doesn't belong to ImageKit).
      // Treat as success so callers don't block on this.
      return NextResponse.json({ deleted: false, reason: 'not_found' }, { status: 200 });
    }

    const delRes = await fetch(`${IMAGEKIT_API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader() },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const text = await delRes.text().catch(() => '');
      return NextResponse.json({ error: 'Delete failed.', detail: text }, { status: 502 });
    }

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    console.error('ImageKit delete error:', err);
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}