import AppLink from '@/src/components/app-link';

export const metadata = {
  title: 'About',
  description:
    'Michael Hale is frontend developer and designer in Charlotte, NC. He works with React, Phoenix, and Rails.'
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <p>
        Michael currently lives in Charlotte, NC working as a consultant. He attended the University of North Carolina at Asheville where
        he received a BA in political science and primarily studied domestic public policy as well as computer science.
      </p>
      <p>
        In the past he has worked with Ruby on Rails, Symfony, WordPress, and Laravel, but he now spends most of his time with React and
        Phoenix.
      </p>
      <p>
        For consulting, employment, or recruiting inquiries, please e-mail{' '}
        <AppLink className="underline" href="mailto:mail@michaelhale.org">
          mail@michaelhale.org
        </AppLink>{' '}
        or send a message through the{' '}
        <AppLink className="underline" href="/contact/">
          contact form
        </AppLink>
        .
      </p>
    </div>
  );
}
