import AppLink from '@/src/components/app-link';

export const metadata = {
  title: 'Contact',
  description:
    'Contact Michael with consulting opportunities and recruiting inquiries at any time.',
};

export default function ContactPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Contact</h1>
      <div className="mt-4 min-h-52 max-w-2xl">
        Whether you are interested in working together or just want to say
        hello, reach out to{' '}
        <AppLink className="underline" href="mailto:mail@michaelhale.com">
          mail@michaelhale.com
        </AppLink>{' '}
        at any time.
      </div>
    </>
  );
}
