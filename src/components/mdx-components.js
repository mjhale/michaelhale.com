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

  function resolveSource(inputSource) {
    const normalizedSrc = normalizePathValue(inputSource);

    if (!normalizedSrc) {
      return '';
    }

    if (normalizedSrc.startsWith('./')) {
      return `${routePath}${normalizedSrc.slice(2)}`;
    }

    return normalizedSrc;
  }

  function toSrcSet(variants) {
    return variants
      .map(variant => `${variant.src} ${variant.width}w`)
      .join(', ');
  }

  return function MdxImage(props) {
    const { alt = '', src = '', title } = props;
    const resolvedSrc = resolveSource(src);
    const entry = imageManifest[resolvedSrc];
    const dimensions =
      entry &&
      Number.isFinite(entry.width) &&
      Number.isFinite(entry.height) &&
      entry.width > 0 &&
      entry.height > 0
        ? { width: entry.width, height: entry.height }
        : null;
    const webpVariants = Array.isArray(entry?.variants?.webp)
      ? entry.variants.webp
      : [];
    const fallbackVariants = Array.isArray(entry?.variants?.fallback)
      ? entry.variants.fallback
      : [];
    const fallbackSrc = fallbackVariants.at(-1)?.src || resolvedSrc;
    const fallbackSrcSet = fallbackVariants.length
      ? toSrcSet(fallbackVariants)
      : undefined;
    const canUseResponsivePicture =
      resolvedSrc.startsWith('/') && dimensions && fallbackSrc;

    if (!canUseResponsivePicture) {
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
      <picture>
        {webpVariants.length ? (
          <source
            sizes="(max-width: 1040px) 100vw, 1040px"
            srcSet={toSrcSet(webpVariants)}
            type="image/webp"
          />
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          className="h-auto w-full border border-brand-ink"
          height={dimensions.height}
          loading="lazy"
          sizes="(max-width: 1040px) 100vw, 1040px"
          src={fallbackSrc}
          srcSet={fallbackSrcSet}
          title={title}
          width={dimensions.width}
        />
      </picture>
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
