'use client';

import { useState } from 'react';

function validate(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = 'Required';
  }

  if (!values.email.trim()) {
    errors.email = 'Required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Invalid email address';
  }

  if (!values.message.trim()) {
    errors.message = 'Required';
  }

  return errors;
}

function InputError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mb-2 text-sm font-semibold text-red-600">{message}</p>;
}

export default function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '', company: '' });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const errors = validate(values);

  const shouldShowError = fieldName => Boolean(errors[fieldName] && (touched[fieldName] || hasSubmitted));

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (Object.keys(errors).length) {
      setStatus({ type: 'error', message: 'Please fix the highlighted fields.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus({ type: 'error', message: result.message || 'Sorry, there was a submission error.' });
        return;
      }

      setValues({ name: '', email: '', message: '', company: '' });
      setTouched({ name: false, email: false, message: false });
      setHasSubmitted(false);
      setStatus({ type: 'success', message: 'Thank you! Michael will get back to you soon.' });
    } catch (_error) {
      setStatus({ type: 'error', message: 'Sorry, there was a submission error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="max-w-2xl space-y-3" onSubmit={handleSubmit}>
      <input
        autoComplete="off"
        className="hidden"
        name="company"
        onChange={event => setValues(current => ({ ...current, company: event.target.value }))}
        tabIndex={-1}
        value={values.company}
      />

      <label className="block text-base" htmlFor="name">
        Name
      </label>
      <InputError message={shouldShowError('name') ? errors.name : ''} />
      <input
        className="mb-3 block w-full max-w-xl border border-brand-lilac bg-white p-2 text-brand-ink outline-offset-2 focus:outline focus:outline-1 focus:outline-brand-lilac"
        id="name"
        name="name"
        onChange={event => setValues(current => ({ ...current, name: event.target.value }))}
        onBlur={() => setTouched(current => ({ ...current, name: true }))}
        value={values.name}
      />

      <label className="block text-base" htmlFor="email">
        Email Address
      </label>
      <InputError message={shouldShowError('email') ? errors.email : ''} />
      <input
        className="mb-3 block w-full max-w-xl border border-brand-lilac bg-white p-2 text-brand-ink outline-offset-2 focus:outline focus:outline-1 focus:outline-brand-lilac"
        id="email"
        name="email"
        onChange={event => setValues(current => ({ ...current, email: event.target.value }))}
        onBlur={() => setTouched(current => ({ ...current, email: true }))}
        type="email"
        value={values.email}
      />

      <label className="block text-base" htmlFor="message">
        Message
      </label>
      <InputError message={shouldShowError('message') ? errors.message : ''} />
      <textarea
        className="mb-3 block min-h-[10rem] w-full max-w-xl border border-brand-lilac bg-white p-2 text-brand-ink outline-offset-2 focus:outline focus:outline-1 focus:outline-brand-lilac"
        id="message"
        name="message"
        onChange={event => setValues(current => ({ ...current, message: event.target.value }))}
        onBlur={() => setTouched(current => ({ ...current, message: true }))}
        value={values.message}
      />

      {status.message ? (
        <p className={status.type === 'error' ? 'text-red-600' : 'text-brand-cream'}>{status.message}</p>
      ) : null}

      <button
        className="rounded border border-brand-plum px-4 py-2 text-sm transition hover:bg-brand-plum hover:text-brand-cream disabled:opacity-50"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
