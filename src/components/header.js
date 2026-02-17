import AppLink from '@/src/components/app-link';
import Nav from '@/src/components/nav';

export default function Header() {
  return (
    <header className="mt-3 bg-[var(--page-header-bg)]">
      <div className="mx-auto flex h-20 w-full max-w-[1040px] items-center justify-between px-5">
        <h1 className="font-display text-3xl font-normal md:text-4xl">
          <AppLink className="text-brand-cream no-underline" href="/">
            Michael Hale
          </AppLink>
        </h1>
        <Nav />
      </div>
    </header>
  );
}
