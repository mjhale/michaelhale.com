import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { z } from 'zod';

const root = process.cwd();
const workDir = path.join(root, 'content', 'work');
const technologyDir = path.join(root, 'content', 'technologies');

const frontmatterSchema = z.object({
  coverImage: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}$/),
  path: z.string().startsWith('/work/'),
  role: z.string().min(1),
  technologies: z.array(z.string().min(1)),
  title: z.string().min(1),
  summary: z.string().min(1),
  style: z.object({
    screenshot_offset: z.string().min(1),
    screenshot_shadow: z.string().min(1)
  })
});

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const resolved = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(resolved));
      continue;
    }

    files.push(resolved);
  }

  return files;
}

function normalizePath(rawPath) {
  let normalized = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function trailingPath(rawPath) {
  const normalized = normalizePath(rawPath);
  return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function normalizeAssetPath(assetPath) {
  const normalized = assetPath.trim();
  return normalized.replace(/^\.?\//, '');
}

function dateSortValue(yyyyMm) {
  return Date.parse(`${yyyyMm}-01T00:00:00.000Z`);
}

function loadTechnologyMap() {
  const technologyFiles = walk(technologyDir).filter(filePath => filePath.endsWith('.yml'));
  const entries = technologyFiles.map(filePath => {
    const parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
    const title = parsed?.title;
    const iconImage = parsed?.iconImage;

    if (!title || !iconImage) {
      throw new Error(`Invalid technology file: ${filePath}`);
    }

    return [title, {
      id: path.basename(filePath, '.yml'),
      title,
      iconImageUrl: `/technologies/${iconImage}`
    }];
  });

  return new Map(entries);
}

const technologyMap = loadTechnologyMap();

function parseWorkFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const frontmatter = frontmatterSchema.parse(data);
  const normalizedPath = normalizePath(frontmatter.path);
  const routePath = trailingPath(normalizedPath);
  const slugSegments = normalizedPath.split('/').filter(Boolean).slice(1);

  const technologies = frontmatter.technologies.map(technologyName => {
    const technology = technologyMap.get(technologyName);

    if (!technology) {
      return {
        id: technologyName.toLowerCase().replace(/\s+/g, '-'),
        title: technologyName,
        iconImageUrl: ''
      };
    }

    return technology;
  });

  const project = {
    id: path.basename(path.dirname(filePath)),
    title: frontmatter.title,
    summary: frontmatter.summary,
    role: frontmatter.role,
    date: frontmatter.date,
    routePath,
    normalizedPath,
    slugSegments,
    coverImageUrl: `${routePath}${normalizeAssetPath(frontmatter.coverImage)}`,
    style: frontmatter.style,
    technologies,
    body: content,
    absoluteFilePath: filePath
  };

  return project;
}

function loadWorkProjects() {
  const mdxFiles = walk(workDir).filter(filePath => filePath.endsWith('.mdx'));

  return mdxFiles
    .map(parseWorkFile)
    .sort((a, b) => dateSortValue(b.date) - dateSortValue(a.date));
}

const allWorkProjects = loadWorkProjects();

export function getAllTechnologies() {
  return Array.from(technologyMap.values());
}

export function getAllWorkProjects() {
  return allWorkProjects;
}

export function getRecentWorkProjects(limit = 3) {
  return allWorkProjects.slice(0, limit);
}

export function getWorkProjectBySlug(slugSegments) {
  if (!Array.isArray(slugSegments) || slugSegments.length === 0) {
    return null;
  }

  const requestedPath = normalizePath(`/work/${slugSegments.join('/')}`);
  return allWorkProjects.find(project => project.normalizedPath === requestedPath) ?? null;
}

export function getAllWorkParams() {
  return allWorkProjects.map(project => ({ slug: project.slugSegments }));
}
