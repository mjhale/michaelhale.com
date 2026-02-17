import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import TechnologyIconList from '@/src/components/technology-icon-list';
import { getAllWorkParams, getWorkProjectBySlug } from '@/src/lib/content';
import { getMdxComponents } from '@/src/components/mdx-components';

export function generateStaticParams() {
  return getAllWorkParams();
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const project = getWorkProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found'
    };
  }

  return {
    title: project.title,
    description: project.summary
  };
}

export default async function WorkDetailPage({ params }) {
  const { slug = [] } = await params;
  const project = getWorkProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <article>
      <style>{`
        :root {
          --page-body-bg: ${project.style.screenshot_shadow};
          --page-header-bg: ${project.style.screenshot_offset};
          --page-main-bg: ${project.style.screenshot_shadow};
        }
      `}</style>

      <h1 className="mt-1 text-3xl font-bold">{project.title}</h1>
      <p className="mt-2 text-md">{project.role}</p>
      <div className="mt-2">
        <TechnologyIconList technologies={project.technologies} />
      </div>

      <div className="prose mt-6 max-w-none">
        <MDXRemote
          components={getMdxComponents({
            backgroundImage: '/images/fractal-noise.svg',
            offsetColor: project.style.screenshot_offset,
            shadowColor: project.style.screenshot_shadow
          })}
          source={project.body}
        />
      </div>
    </article>
  );
}
