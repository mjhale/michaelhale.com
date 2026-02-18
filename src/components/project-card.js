import Image from 'next/image';
import AppLink from '@/src/components/app-link';
import TechnologyIconList from '@/src/components/technology-icon-list';

export default function ProjectCard({ project }) {
  return (
    <AppLink
      className="group block h-full overflow-hidden rounded-md"
      href={project.routePath}
    >
      <div className="relative min-h-[275px]">
        <Image
          alt={project.title}
          className="object-cover"
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          src={project.coverImageUrl}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-plum-dark/80 via-brand-lilac/85 to-brand-lilac/95 opacity-110 transition group-hover:opacity-75" />
        <div className="relative z-10 flex h-full min-h-[275px] flex-col justify-between p-6">
          <div>
            <h3 className="font-serif text-2xl text-white">{project.title}</h3>
            <p className="mt-3 text-sm text-white/95">{project.summary}</p>
          </div>
          <TechnologyIconList technologies={project.technologies} />
        </div>
      </div>
    </AppLink>
  );
}
