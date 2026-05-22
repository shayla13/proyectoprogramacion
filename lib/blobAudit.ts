import { put, list } from '@vercel/blob';
import type { AuditEntry } from './types';

function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN no configurado');
  return token;
}

async function fetchBlobText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch blob: ${res.status}`);
  return res.text();
}

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  const token = getBlobToken();
  const yyyymm = entry.timestamp.slice(0, 7).replace('-', '');
  const filename = `audit/${yyyymm}.json`;

  let existing: AuditEntry[] = [];
  try {
    const { blobs } = await list({ prefix: filename, token });
    if (blobs.length > 0) {
      const text = await fetchBlobText(blobs[0].url);
      existing = JSON.parse(text);
    }
  } catch {
    existing = [];
  }

  existing.push(entry);

  await put(filename, JSON.stringify(existing, null, 2), {
    access: 'public',
    token,
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function readAuditMonth(yyyymm: string): Promise<AuditEntry[]> {
  const token = getBlobToken();
  const filename = `audit/${yyyymm}.json`;

  try {
    const { blobs } = await list({ prefix: filename, token });
    if (blobs.length === 0) return [];
    const text = await fetchBlobText(blobs[0].url);
    return JSON.parse(text);
  } catch {
    return [];
  }
}
