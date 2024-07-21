import { readFileSync } from 'fs';
import { join } from 'path';

const readJsonFile = <T>(path: string): T => {
  const buffer = readFileSync(path);
  return JSON.parse(buffer.toString('utf-8'));
};

const packageJson = readJsonFile<{
  version?: string;
  [key: string]: unknown;
}>(join(__dirname, '../package.json'));

export const version = packageJson.version ?? '0.0.0';
