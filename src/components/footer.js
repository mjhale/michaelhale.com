import AppLink from '@/src/components/app-link';

export default function Footer() {
  return (
    <footer className="mx-auto flex w-full max-w-[1040px] items-center justify-between px-5 py-8 text-sm text-brand-cream">
      <p>© {new Date().getFullYear()} Michael Hale</p>
      <ul className="flex items-center gap-4">
        <li>
          <AppLink
            className="text-brand-cream no-underline transition hover:text-white"
            href="https://github.com/mjhale"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </AppLink>
        </li>
      </ul>
    </footer>
  );
}
