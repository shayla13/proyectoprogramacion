import fs from 'fs';
import path from 'path';

interface SeedData {
  users: {
    email: string;
    password_hash: string;
    name: string;
    role: string;
    is_active: boolean;
  }[];
  system_config: {
    institution_name: string;
    allowed_domain: string;
    min_evaluations_to_publish: number;
  };
}

let seedCache: SeedData | null = null;

export function getSeedData(): SeedData {
  if (seedCache) return seedCache;
  const filePath = path.join(process.cwd(), 'data', 'seed.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  seedCache = JSON.parse(raw);
  return seedCache!;
}
