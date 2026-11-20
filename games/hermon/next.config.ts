import type { NextConfig } from 'next';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { HERMON_PATH } from './src/paths';

// A report from a local build or a deployed one can identify the same game and assets.
const files = ['src', 'public'].flatMap(dir =>
  readdirSync(join(__dirname, dir), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(__dirname, join(entry.parentPath, entry.name))));
const fingerprint = createHash('sha256');
for (const file of [...files, 'next.config.ts', 'package-lock.json'].sort()) {
  fingerprint.update(file).update('\0').update(readFileSync(join(__dirname, file))).update('\0');
}

const config: NextConfig = {
  output: 'export',
  basePath: HERMON_PATH,
  trailingSlash: false,
  turbopack: { root: __dirname },
  devIndicators: false,
  env: { NEXT_PUBLIC_HERMON_BUILD: fingerprint.digest('hex').slice(0, 12) },
};

export default config;
