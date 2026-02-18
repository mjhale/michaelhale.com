import fs from 'node:fs';
import path from 'node:path';

export function getImageManifest() {
  const manifestPath = path.join(
    process.cwd(),
    'public',
    'generated',
    'image-manifest.json'
  );

  if (!fs.existsSync(manifestPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (_error) {
    return {};
  }
}
