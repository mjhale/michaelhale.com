import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { imageSize } from 'image-size';
import { parseFrontmatter } from '../src/lib/frontmatter.mjs';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const workDir = path.join(root, 'content', 'work');
const technologyDir = path.join(root, 'content', 'technologies');
const assetsImageDir = path.join(root, 'assets', 'images');
const generatedDir = path.join(publicDir, 'generated');
const manifestPath = path.join(generatedDir, 'image-manifest.json');
const imageManifest = {};
const expectedPublicFiles = new Set();
const imageSyncStats = {
  reused: 0,
  regenerated: 0
};
const scriptStart = Date.now();

const GENERATOR_VERSION = 1;
const RESPONSIVE_WIDTHS = [480, 768, 1024, 1440, 1920];
let sharpModule;
let previousImageManifest = {};

function ensureDir(dirPath) {
  const resolvedPath = path.resolve(dirPath);

  if (fs.existsSync(resolvedPath)) {
    if (fs.lstatSync(resolvedPath).isDirectory()) {
      return;
    }

    fs.rmSync(resolvedPath, { recursive: true, force: true });
  }

  const parentDir = path.dirname(resolvedPath);

  if (parentDir !== resolvedPath) {
    ensureDir(parentDir);
  }

  fs.mkdirSync(resolvedPath);
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

function publicPathToFilePath(publicPath) {
  const relativePath = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  return path.join(publicDir, relativePath.split('/').join(path.sep));
}

function hashBuffer(fileBuffer) {
  return createHash('sha256').update(fileBuffer).digest('hex');
}

function shouldGenerateVariants(extension) {
  return ['.png', '.jpg', '.jpeg'].includes(extension);
}

function logStep(message) {
  console.log(`[sync-assets] ${message}`);
}

function markExpectedPublicFile(filePath) {
  expectedPublicFiles.add(path.resolve(filePath));
}

function markExpectedPublicPath(publicPath) {
  markExpectedPublicFile(publicPathToFilePath(publicPath));
}

function markImageVariantOutputs(variants) {
  for (const variant of [...variants.webp, ...variants.fallback]) {
    markExpectedPublicPath(variant.src);
  }
}

function imageVariantFilePaths(entry) {
  const variants = entry?.variants || {};
  return [...(variants.webp || []), ...(variants.fallback || [])].map(variant =>
    publicPathToFilePath(variant.src)
  );
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasExpectedCacheMetadata(entry, sourceHash) {
  return entry?.sourceHash === sourceHash && entry.generatorVersion === GENERATOR_VERSION;
}

function hasValidVariantList(variants) {
  return variants.every(
    variant =>
      typeof variant?.src === 'string' &&
      Number.isFinite(variant.width) &&
      Number.isFinite(variant.height) &&
      variant.width > 0 &&
      variant.height > 0
  );
}

function areVariantListsEqual(leftVariants, rightVariants) {
  if (leftVariants.length !== rightVariants.length) {
    return false;
  }

  return leftVariants.every((leftVariant, index) => {
    const rightVariant = rightVariants[index];

    return (
      leftVariant.src === rightVariant.src &&
      leftVariant.width === rightVariant.width &&
      leftVariant.height === rightVariant.height
    );
  });
}

function hasValidImageManifestShape(entry, currentSize, currentVariants) {
  return (
    entry &&
    entry.width === currentSize.width &&
    entry.height === currentSize.height &&
    Array.isArray(entry.variants?.webp) &&
    Array.isArray(entry.variants?.fallback) &&
    hasValidVariantList(entry.variants.webp) &&
    hasValidVariantList(entry.variants.fallback) &&
    areVariantListsEqual(entry.variants.webp, currentVariants.webp) &&
    areVariantListsEqual(entry.variants.fallback, currentVariants.fallback)
  );
}

function hasExistingGeneratedFiles(entry, originalOutputPath) {
  return (
    fs.existsSync(originalOutputPath) &&
    imageVariantFilePaths(entry).every(filePath => fs.existsSync(filePath))
  );
}

function getReusableImageEntry(previousEntry, currentSize, currentVariants, sourceHash, originalOutputPath) {
  if (!hasExpectedCacheMetadata(previousEntry, sourceHash)) {
    return null;
  }

  if (!hasValidImageManifestShape(previousEntry, currentSize, currentVariants)) {
    return null;
  }

  if (!hasExistingGeneratedFiles(previousEntry, originalOutputPath)) {
    return null;
  }

  return previousEntry;
}

function prepareOutputFile(filePath) {
  ensureDir(path.dirname(filePath));

  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isDirectory()) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

function copyPublicFile(sourcePath, outputPath) {
  prepareOutputFile(outputPath);
  fs.copyFileSync(sourcePath, outputPath);
}

function preparePublicDirectory() {
  logStep('Preparing public directory');
  ensureDir(publicDir);
}

function removeStaleEntriesInDir(dirPath, totals) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const resolvedPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      removeStaleEntriesInDir(resolvedPath, totals);

      if (fs.readdirSync(resolvedPath).length === 0) {
        fs.rmdirSync(resolvedPath);
        totals.directories += 1;
      }

      continue;
    }

    if (expectedPublicFiles.has(path.resolve(resolvedPath))) {
      continue;
    }

    fs.rmSync(resolvedPath, { force: true });
    totals.files += 1;
  }
}

function removeStalePublicEntries() {
  const controlledDirs = [
    path.join(publicDir, 'technologies'),
    path.join(publicDir, 'images'),
    path.join(publicDir, 'work'),
    generatedDir
  ];
  const totals = {
    files: 0,
    directories: 0
  };

  for (const controlledDir of controlledDirs) {
    if (!fs.existsSync(controlledDir)) {
      continue;
    }

    removeStaleEntriesInDir(controlledDir, totals);
  }

  return totals;
}

function loadPreviousImageManifest() {
  if (!fs.existsSync(manifestPath)) {
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return isPlainObject(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function createImageManifestEntry(size, variants, sourceHash) {
  return {
    width: size.width,
    height: size.height,
    variants,
    sourceHash,
    generatorVersion: GENERATOR_VERSION
  };
}

function readWorkEntry(mdxFilePath) {
  const sourceDir = path.dirname(mdxFilePath);
  const source = fs.readFileSync(mdxFilePath, 'utf8');
  const parsed = parseFrontmatter(source, mdxFilePath);
  const routePath = normalizeWorkPath(parsed.data.path || '');

  if (!routePath.startsWith('/work/')) {
    throw new Error(`Invalid work path in ${mdxFilePath}: ${routePath}`);
  }

  return {
    mdxFilePath,
    routePath,
    sourceDir,
    outputDir: path.join(publicDir, routePath.replace(/^\//, ''))
  };
}

function getWorkAssetFileNames(sourceDir) {
  return fs
    .readdirSync(sourceDir)
    .filter(fileName => !fileName.endsWith('.mdx') && !fileName.startsWith('.'))
    .sort();
}

async function getSharpModule() {
  if (sharpModule !== undefined) {
    return sharpModule;
  }

  try {
    const imported = await import('sharp');
    sharpModule = imported.default;
    return sharpModule;
  } catch (_error) {
    sharpModule = null;
    return sharpModule;
  }
}

function sizeForWidth(originalWidth, originalHeight, width) {
  const ratio = width / originalWidth;
  return {
    width,
    height: Math.round(originalHeight * ratio)
  };
}

function getResponsiveVariantPlan(routePath, fileName, originalSize, canGenerateVariants) {
  const extension = path.extname(fileName).toLowerCase();

  if (!canGenerateVariants) {
    return {
      webp: [],
      fallback: []
    };
  }

  const baseName = path.basename(fileName, extension);
  const widths = RESPONSIVE_WIDTHS.filter(width => width < originalSize.width);
  const variants = {
    webp: [],
    fallback: []
  };

  for (const width of widths) {
    const resized = sizeForWidth(originalSize.width, originalSize.height, width);

    const fallbackName = `${baseName}-${width}${extension}`;
    const fallbackPublicPath = normalizePublicPath(path.join(routePath, fallbackName));
    const webpName = `${baseName}-${width}.webp`;
    const webpPublicPath = normalizePublicPath(path.join(routePath, webpName));

    variants.fallback.push({
      src: fallbackPublicPath,
      width: resized.width,
      height: resized.height
    });

    variants.webp.push({
      src: webpPublicPath,
      width: resized.width,
      height: resized.height
    });
  }

  return variants;
}

async function generateResponsiveVariants(sourcePath, outputDir, routePath, fileName, originalSize) {
  const sharp = await getSharpModule();
  const extension = path.extname(fileName).toLowerCase();

  if (!sharp || !shouldGenerateVariants(extension)) {
    return;
  }

  const baseName = path.basename(fileName, extension);
  const widths = RESPONSIVE_WIDTHS.filter(width => width < originalSize.width);

  if (widths.length > 0) {
    logStep(`Generating ${widths.length} responsive variant(s) for ${normalizePublicPath(path.join(routePath, fileName))}`);
  }

  for (const width of widths) {
    const fallbackName = `${baseName}-${width}${extension}`;
    const fallbackOutputPath = path.join(outputDir, fallbackName);

    let fallbackPipeline = sharp(sourcePath).resize({ width, withoutEnlargement: true });

    if (extension === '.png') {
      fallbackPipeline = fallbackPipeline.png({ compressionLevel: 9, palette: true });
    } else {
      fallbackPipeline = fallbackPipeline.jpeg({ quality: 80, mozjpeg: true });
    }

    prepareOutputFile(fallbackOutputPath);
    await fallbackPipeline.toFile(fallbackOutputPath);

    const webpName = `${baseName}-${width}.webp`;
    const webpOutputPath = path.join(outputDir, webpName);

    prepareOutputFile(webpOutputPath);
    await sharp(sourcePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(webpOutputPath);
  }
}

async function registerImageMetadata(publicPath, sourcePath, outputDir, routePath, fileName) {
  const extension = path.extname(sourcePath).toLowerCase();
  const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);

  if (!imageExtensions.has(extension)) {
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(sourcePath);
    const sourceHash = hashBuffer(fileBuffer);
    const size = imageSize(fileBuffer);

    if (!size?.width || !size?.height) {
      return;
    }

    const originalSize = {
      width: size.width,
      height: size.height
    };
    const sharp = await getSharpModule();
    const canGenerateVariants = Boolean(sharp) && shouldGenerateVariants(extension);
    const variants = getResponsiveVariantPlan(routePath, fileName, originalSize, canGenerateVariants);
    const reusableEntry = getReusableImageEntry(
      previousImageManifest[publicPath],
      size,
      variants,
      sourceHash,
      publicPathToFilePath(publicPath)
    );
    const manifestEntry = reusableEntry || createImageManifestEntry(size, variants, sourceHash);

    if (reusableEntry) {
      imageSyncStats.reused += 1;
    } else {
      imageSyncStats.regenerated += 1;
      await generateResponsiveVariants(sourcePath, outputDir, routePath, fileName, originalSize);
    }

    markImageVariantOutputs(manifestEntry.variants);
    imageManifest[publicPath] = manifestEntry;
  } catch (_error) {
    // Skip files that cannot be measured.
  }
}

function syncTechnologyAssets() {
  const outDir = path.join(publicDir, 'technologies');
  ensureDir(outDir);

  const files = fs
    .readdirSync(technologyDir)
    .filter(fileName => fileName.endsWith('.svg'))
    .sort();

  for (const fileName of files) {
    const outputFilePath = path.join(outDir, fileName);
    copyPublicFile(path.join(technologyDir, fileName), outputFilePath);
    markExpectedPublicFile(outputFilePath);
  }

  return files.length;
}

function syncImageAssets() {
  const outDir = path.join(publicDir, 'images');
  ensureDir(outDir);

  const files = fs
    .readdirSync(assetsImageDir)
    .filter(fileName => !fileName.startsWith('.'))
    .sort();

  for (const fileName of files) {
    const outputFilePath = path.join(outDir, fileName);
    copyPublicFile(path.join(assetsImageDir, fileName), outputFilePath);
    markExpectedPublicFile(outputFilePath);
  }

  return files.length;
}

async function syncWorkAsset(workEntry, assetFileName) {
  const sourceFilePath = path.join(workEntry.sourceDir, assetFileName);
  const outputFilePath = path.join(workEntry.outputDir, assetFileName);

  copyPublicFile(sourceFilePath, outputFilePath);
  markExpectedPublicFile(outputFilePath);

  await registerImageMetadata(
    normalizePublicPath(path.join(workEntry.routePath, assetFileName)),
    sourceFilePath,
    workEntry.outputDir,
    workEntry.routePath,
    assetFileName
  );
}

async function syncWorkAssets() {
  const mdxFiles = walk(workDir)
    .filter(filePath => filePath.endsWith('.mdx'))
    .sort();
  let copiedAssetCount = 0;

  for (const [index, mdxFilePath] of mdxFiles.entries()) {
    const workEntry = readWorkEntry(mdxFilePath);
    ensureDir(workEntry.outputDir);
    logStep(`Syncing work assets (${index + 1}/${mdxFiles.length}): ${workEntry.routePath}`);

    for (const assetFileName of getWorkAssetFileNames(workEntry.sourceDir)) {
      await syncWorkAsset(workEntry, assetFileName);
      copiedAssetCount += 1;
    }
  }

  return {
    mdxCount: mdxFiles.length,
    copiedAssetCount
  };
}

function writeImageManifest() {
  ensureDir(generatedDir);
  markExpectedPublicFile(manifestPath);
  fs.writeFileSync(manifestPath, JSON.stringify(imageManifest, null, 2));
}

async function syncAssets() {
  logStep('Starting asset sync');
  preparePublicDirectory();
  previousImageManifest = loadPreviousImageManifest();

  logStep('Syncing technology SVGs');
  const technologyCount = syncTechnologyAssets();
  logStep(`Copied ${technologyCount} technology icon(s)`);

  logStep('Syncing shared image assets');
  const sharedImageCount = syncImageAssets();
  logStep(`Copied ${sharedImageCount} shared image asset(s)`);

  logStep('Syncing work entry assets');
  const { mdxCount, copiedAssetCount } = await syncWorkAssets();
  logStep(`Processed ${mdxCount} work file(s) and copied ${copiedAssetCount} work asset(s)`);
  logStep(
    `Reused ${imageSyncStats.reused} image manifest entries; regenerated ${imageSyncStats.regenerated} image manifest entries`
  );

  logStep('Writing image manifest');
  writeImageManifest();

  logStep('Removing stale public asset files');
  const staleEntryCounts = removeStalePublicEntries();
  const directoryLabel = staleEntryCounts.directories === 1 ? 'directory' : 'directories';
  logStep(
    `Removed ${staleEntryCounts.files} stale public asset file(s) and ${staleEntryCounts.directories} empty public ${directoryLabel}`
  );

  const elapsedMs = Date.now() - scriptStart;
  logStep(`Done in ${(elapsedMs / 1000).toFixed(1)}s`);
}

await syncAssets();
