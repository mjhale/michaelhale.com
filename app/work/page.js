import AppLink from '@/src/components/app-link';
import WorkListItem from '@/src/components/work-list-item';
import { getAllWorkProjects } from '@/src/lib/content';

export const metadata = {
  title: 'Work and Projects',
  description:
    'Michael has worked with a wide range of companies on projects big and small, from consulting on design systems to implementing complete project revamps.',
};

export default function WorkPage() {
  const projects = getAllWorkProjects();

  return (
    <>
      <h1 className="text-3xl font-bold">Work</h1>
      <p className="mt-3">
        Interested in working together?{' '}
        <AppLink className="underline" href="/contact/">
          Get in touch.
        </AppLink>
      </p>

      <h2 className="mt-8 text-2xl font-bold">Select Projects</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {projects.map(project => (
          <WorkListItem key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}
