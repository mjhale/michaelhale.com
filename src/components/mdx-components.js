import Image from 'next/image';
import AppLink from '@/src/components/app-link';

function sanitizeStyleValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^['"]+|['"]+$/g, '');
}

function createScreenshotComponent(defaults) {
  return function Screenshot({
    backgroundImage,
    children,
    offsetColor,
    shadowColor,
  }) {
    const resolvedBackgroundImage =
      sanitizeStyleValue(backgroundImage) ||
      sanitizeStyleValue(defaults.backgroundImage);
    const resolvedOffsetColor =
      sanitizeStyleValue(offsetColor) ||
      sanitizeStyleValue(defaults.offsetColor);
    const resolvedShadowColor =
      sanitizeStyleValue(shadowColor) ||
      sanitizeStyleValue(defaults.shadowColor);

    return (
      <div
        className="mb-6 overflow-hidden md:p-8"
        style={{
          backgroundColor: resolvedOffsetColor || 'transparent',
          backgroundImage: resolvedBackgroundImage
            ? `url(${resolvedBackgroundImage})`
            : 'none',
          backgroundRepeat: resolvedBackgroundImage ? 'repeat' : 'no-repeat',
        }}
      >
        <div
          className="shadow-screenshot m-4 md:m-8"
          style={{
            boxShadow: `0 0.5vw 2.5vw rgba(0,0,0,0.35), 0 2vw 4.75vw 1.25vw ${resolvedShadowColor || 'transparent'}`,
          }}
        >
          {children}
        </div>
      </div>
    );
  };
}

function normalizePathValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^['"]+|['"]+$/g, '');
}

function createMdxImageComponent(defaults) {
  const routePath = normalizePathValue(defaults.routePath || '/');
  const imageManifest = defaults.imageManifest || {};

  return function MdxImage(props) {
    const { alt = '', src = '', title } = props;
    const normalizedSrc = normalizePathValue(src);

    let resolvedSrc = normalizedSrc;

    if (normalizedSrc.startsWith('./')) {
      resolvedSrc = `${routePath}${normalizedSrc.slice(2)}`;
    }

    const dimensions = imageManifest[resolvedSrc];
    const canUseNextImage =
      resolvedSrc.startsWith('/') &&
      dimensions &&
      Number.isFinite(dimensions.width) &&
      Number.isFinite(dimensions.height);

    if (!canUseNextImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          {...props}
          alt={alt}
          className="w-full border border-brand-ink"
          loading="lazy"
        />
      );
    }

    return (
      <Image
        alt={alt}
        className="h-auto w-full border border-brand-ink"
        height={dimensions.height}
        sizes="(max-width: 1040px) 100vw, 1040px"
        src={resolvedSrc}
        title={title}
        width={dimensions.width}
      />
    );
  };
}

function MdxLink({ href, ...props }) {
  const className = 'underline underline-offset-2';
  return <AppLink className={className} href={href} {...props} />;
}

export function getMdxComponents(defaults = {}) {
  return {
    Screenshot: createScreenshotComponent(defaults),
    img: createMdxImageComponent(defaults),
    a: MdxLink,
    Link: MdxLink,
  };
}
