import AppLink from '@/src/components/app-link';

export const metadata = {
  title: 'Page Not Found',
};

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold">404 Not Found</h1>
      <p>This page does not exist.</p>
      <p>
        <AppLink className="underline" href="/">
          Return home.
        </AppLink>
      </p>
    </div>
  );
}
