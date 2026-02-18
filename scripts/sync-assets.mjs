import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { imageSize } from 'image-size';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const workDir = path.join(root, 'content', 'work');
const technologyDir = path.join(root, 'content', 'technologies');
const assetsImageDir = path.join(root, 'assets', 'images');
const generatedDir = path.join(publicDir, 'generated');
const imageManifest = {};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const resolvedPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(resolvedPath));
      continue;
    }

    files.push(resolvedPath);
  }

  return files;
}

function normalizeWorkPath(rawPath) {
  let normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function normalizePublicPath(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function registerImageMetadata(publicPath, sourcePath) {
  const extension = path.extname(sourcePath).toLowerCase();
  const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);

  if (!imageExtensions.has(extension)) {
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(sourcePath);
    const size = imageSize(fileBuffer);

    if (!size?.width || !size?.height) {
      return;
    }

    imageManifest[publicPath] = {
      width: size.width,
      height: size.height
    };
  } catch (_error) {
    // Skip files that cannot be measured.
  }
}

function syncTechnologyAssets() {
  const outDir = path.join(publicDir, 'technologies');
  ensureDir(outDir);

  const files = fs.readdirSync(technologyDir).filter(fileName => fileName.endsWith('.svg'));

  for (const fileName of files) {
    fs.copyFileSync(path.join(technologyDir, fileName), path.join(outDir, fileName));
  }
}

function syncImageAssets() {
  const outDir = path.join(publicDir, 'images');
  ensureDir(outDir);

  const files = fs.readdirSync(assetsImageDir).filter(fileName => !fileName.startsWith('.'));

  for (const fileName of files) {
    fs.copyFileSync(path.join(assetsImageDir, fileName), path.join(outDir, fileName));
  }
}

function syncWorkAssets() {
  const mdxFiles = walk(workDir).filter(filePath => filePath.endsWith('.mdx'));

  for (const mdxFilePath of mdxFiles) {
    const sourceDir = path.dirname(mdxFilePath);
    const source = fs.readFileSync(mdxFilePath, 'utf8');
    const parsed = matter(source);
    const routePath = normalizeWorkPath(parsed.data.path || '');

    if (!routePath.startsWith('/work/')) {
      throw new Error(`Invalid work path in ${mdxFilePath}: ${routePath}`);
    }

    const outputDir = path.join(publicDir, routePath.replace(/^\//, ''));
    ensureDir(outputDir);

    const assets = fs
      .readdirSync(sourceDir)
      .filter(fileName => !fileName.endsWith('.mdx') && !fileName.startsWith('.'));

    for (const assetFileName of assets) {
      const sourceFilePath = path.join(sourceDir, assetFileName);
      const outputFilePath = path.join(outputDir, assetFileName);
      fs.copyFileSync(sourceFilePath, outputFilePath);
      registerImageMetadata(normalizePublicPath(path.join(routePath, assetFileName)), sourceFilePath);
    }
  }
}

function writeImageManifest() {
  ensureDir(generatedDir);
  fs.writeFileSync(path.join(generatedDir, 'image-manifest.json'), JSON.stringify(imageManifest, null, 2));
}

cleanDir(publicDir);
syncTechnologyAssets();
syncImageAssets();
syncWorkAssets();
writeImageManifest();
