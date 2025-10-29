import React, { useMemo } from 'react';

const toWebp = (src) => {
  if (!src) return null;
  try {
    const url = new URL(src, window.location.origin);
    // Unsplash optimization
    if (url.hostname.includes('images.unsplash.com')) {
      // Preserve existing params and add fm=webp
      url.searchParams.set('fm', 'webp');
      // Prefer width param if not present
      if (!url.searchParams.get('w')) {
        url.searchParams.set('w', '800');
      }
      return url.toString();
    }
    // Basic extension swap for common formats
    if (/\.(jpg|jpeg|png)$/i.test(url.pathname)) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return null;
  } catch {
    // If not a valid URL (could be base64), skip
    return null;
  }
};

const LazyImage = ({ src, alt = '', className = '', style, webpSrc: webpProp, onError, ...rest }) => {
  const computedWebp = useMemo(() => webpProp || toWebp(src), [webpProp, src]);
  const handleError = (e) => {
    if (onError) return onError(e);
    // If webp fails, browser will try <img> fallback automatically.
  };

  return (
    <picture>
      {computedWebp && <source type="image/webp" srcSet={computedWebp} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        style={style}
        onError={handleError}
        {...rest}
      />
    </picture>
  );
};

export default LazyImage;
