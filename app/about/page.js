import AppLink from '@/src/components/app-link';

export const metadata = {
  title: 'About',
  description:
    'Michael Hale is frontend developer and designer in Charlotte, NC. He works with React, Phoenix, and Rails.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <p>
        Michael has worked as a software consultant for more than ten years. He
        attended the University of North Carolina at Asheville where he studied
        political science and computer science.
      </p>
      <p>
        He has worked with Ruby on Rails, Symfony, WordPress, and Laravel, and
        now spends most of his time working in JavaScript, TypeScript, and
        Elixir environments.
      </p>
      <p>
        For consulting opportunities or recruiting inquiries, reach out to{' '}
        <AppLink className="underline" href="mailto:mail@michaelhale.com">
          mail@michaelhale.com
        </AppLink>
        .
      </p>
    </div>
  );
}
