import Link from 'next/link';

function isExternal(href) {
  return (
    href?.startsWith('http://') ||
    href?.startsWith('https://') ||
    href?.startsWith('mailto:')
  );
}

export default function AppLink({ children, className, href, ...rest }) {
  if (isExternal(href)) {
    return (
      <a className={className} href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={href} {...rest}>
      {children}
    </Link>
  );
}
