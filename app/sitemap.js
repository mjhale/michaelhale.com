import { getAllWorkProjects } from '@/src/lib/content';
import { site } from '@/src/lib/site';

export default function sitemap() {
  const staticRoutes = ['/', '/about/', '/contact/', '/work/'];
  const workRoutes = getAllWorkProjects().map(project => project.routePath);

  return [...staticRoutes, ...workRoutes].map(route => ({
    url: `${site.siteUrl}${route}`,
    changeFrequency: 'monthly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
