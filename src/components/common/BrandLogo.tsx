/**
 * BrandLogo
 * - Purpose: Display the ClinicalRxQ brand logo as an image.
 * - Usage: Reusable wherever the brand mark is needed.
 */

import React from 'react';

export const LOGO_URL =
  'https://pub-cdn.sider.ai/u/U03VH4NVNOE/web-coder/687655a5b1dac45b18db4f5c/resource/e6cc61e0-3903-48b8-a88f-6e22f5b73e5b.png';

export interface BrandLogoProps {
  /** Pixel size for both width and height */
  size?: number;
  /** Alt text for accessibility */
  alt?: string;
  /** Extra classes for styling */
  className?: string;
}

/**
 * BrandLogo component
 * - Renders a square logo image with object-contain to avoid cropping.
 */
export default function BrandLogo({ size = 28, alt = 'ClinicalRxQ logo', className }: BrandLogoProps) {
  return (
    <img
      src={LOGO_URL}
      alt={alt}
      style={{ width: size, height: size }}
      className={['rounded-md object-contain', className || ''].join(' ')}
      draggable={false}
    />
  );
}
