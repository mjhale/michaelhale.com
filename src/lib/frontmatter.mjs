import { load as loadYaml } from 'js-yaml';

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;

export function parseFrontmatter(source, sourceLabel = 'source') {
  const normalizedSource = source.startsWith('\uFEFF')
    ? source.slice(1)
    : source;
  const match = normalizedSource.match(frontmatterPattern);

  if (!match) {
    throw new Error(`Missing YAML frontmatter in ${sourceLabel}`);
  }

  const data = loadYaml(match[1]) ?? {};

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`Invalid YAML frontmatter in ${sourceLabel}`);
  }

  return {
    data,
    content: match[2],
  };
}
