import Image from 'next/image';
import AppLink from '@/src/components/app-link';
import ProjectCard from '@/src/components/project-card';
import { getRecentWorkProjects } from '@/src/lib/content';

export default function HomePage() {
  const recentWork = getRecentWorkProjects();

  return (
    <>
      <section className="mb-8">
        <div
          className="relative mb-4 min-h-[220px] w-full overflow-hidden md:float-right md:mb-3 md:ml-8 md:w-[360px]"
          style={{
            maskImage: 'url(/images/brush-mask.svg)',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
          }}
        >
          <Image
            alt="The skyline of Charlotte, NC on a sunny day."
            className="object-cover"
            fill
            sizes="(max-width: --breakpoint-md) 100vw, 360px"
            src="/images/charlotte-skyline.jpg"
          />
        </div>

        <div className="md:after:block md:after:clear-both md:after:content-['']">
          <h1 className="font-serif text-3xl lowercase tracking-wide italic">
            software{' '}
            <span className="font-sans text-2xl font-normal not-italic">
              engineer
            </span>
          </h1>
          <p className="mt-3">
            Michael Hale is a software engineer with expertise in building
            scalable applications.
          </p>
          <p className="mt-3">
            He has experience with TypeScript, Elixir, Ruby, C#, and PHP. For
            more than ten years he has partnered with clients who share a
            commitment to creativity, integrity, and craft.
          </p>
        </div>
      </section>

      <section className="my-5">
        <h2 className="font-serif text-3xl lowercase tracking-wide italic">
          Recent{' '}
          <span className="font-sans text-2xl font-normal not-italic">
            Work
          </span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recentWork.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <p className="mt-6">
        Looking for more?{' '}
        <AppLink className="underline" href="/work/">
          View all projects.
        </AppLink>
      </p>
    </>
  );
}
