import ContactForm from '@/src/components/contact-form';

export const metadata = {
  title: 'Contact',
  description:
    'Contact Michael with consulting, employment, and recruiting inquiries at any time.',
};

export default function ContactPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Contact Michael</h1>
      <p className="mt-4 max-w-2xl">
        Whether you are interested in working together or just want to say
        hello, fill out the form and Michael will be in touch as soon as
        possible.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </>
  );
}
