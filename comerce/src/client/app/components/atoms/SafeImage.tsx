"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc: string;
};

const normalizeSrc = (src: string | null | undefined, fallbackSrc: string) => {
  if (typeof src !== "string") {
    return fallbackSrc;
  }

  const trimmed = src.trim();
  return trimmed || fallbackSrc;
};

const isLocalRuntimeSrc = (src: string) =>
  src.startsWith("data:") || src.startsWith("blob:");

export default function SafeImage({
  src,
  fallbackSrc,
  unoptimized,
  onError,
  alt,
  ...props
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() =>
    normalizeSrc(src, fallbackSrc)
  );

  useEffect(() => {
    setCurrentSrc(normalizeSrc(src, fallbackSrc));
  }, [src, fallbackSrc]);

  const shouldSkipOptimization =
    unoptimized ??
    (isLocalRuntimeSrc(currentSrc) || isLocalRuntimeSrc(fallbackSrc));

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={shouldSkipOptimization}
      onError={(event) => {
        onError?.(event);

        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
