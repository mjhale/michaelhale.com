'use client';

import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import AppLink from '@/src/components/app-link';

const navLinks = [
  { href: '/work/', label: 'Work' },
  { href: '/contact/', label: 'Contact' }
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      document.body.removeAttribute('data-mobile-menu-open');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('data-mobile-menu-open', 'true');

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.removeAttribute('data-mobile-menu-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const menuElement = menuRef.current;

    if (!menuElement) {
      return;
    }

    const focusableElements = menuElement.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    firstFocusable?.focus();

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !firstFocusable || !lastFocusable) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <nav aria-label="Main" className="relative flex">
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="relative z-40 h-11 w-11 rounded-md md:hidden"
        onClick={() => setOpen(current => !current)}
        ref={toggleRef}
        type="button"
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        <span
          className={clsx(
            'absolute left-2 top-3 h-0.5 w-7 bg-brand-cream transition motion-reduce:transition-none',
            open ? 'translate-y-[9px] rotate-45' : ''
          )}
        />
        <span
          className={clsx(
            'absolute left-2 top-5 h-0.5 w-7 bg-brand-cream transition motion-reduce:transition-none',
            open ? '-rotate-45' : ''
          )}
        />
        <span
          className={clsx(
            'absolute left-2 top-7 h-0.5 w-7 bg-brand-cream transition motion-reduce:transition-none',
            open ? 'opacity-0' : ''
          )}
        />
      </button>

      <button
        aria-label="Close menu"
        aria-hidden={!open}
        className={clsx(
          'fixed inset-x-0 bottom-0 top-[5.75rem] z-20 bg-brand-cream/95 backdrop-brightness-60 transition md:hidden motion-reduce:transition-none',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => {
          setOpen(false);
          toggleRef.current?.focus();
        }}
        tabIndex={open ? 0 : -1}
        type="button"
      />

      <ul
        className={clsx(
          'md:static md:z-auto md:flex md:items-center md:gap-4',
          open
            ? 'fixed left-4 right-4 top-32 z-30 flex flex-col rounded-md border-2 border-[var(--page-header-bg)]/90 bg-[var(--page-header-bg)] px-2 shadow-2xl ring-1 ring-black/35'
            : 'hidden md:flex'
        )}
        aria-label={open ? 'Mobile navigation menu' : undefined}
        aria-modal={open ? 'true' : undefined}
        id={menuId}
        ref={menuRef}
        role={open ? 'dialog' : undefined}
      >
        {navLinks.map(link => (
          <li className="border-b border-brand-cream/30 py-2 last:border-b-0 md:border-none md:p-0" key={link.href}>
            <AppLink
              className="block rounded px-3 py-3 text-base lowercase tracking-[0.1em] text-brand-cream transition hover:bg-[var(--page-header-bg)]/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cream md:px-0 md:py-0 md:text-sm"
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
