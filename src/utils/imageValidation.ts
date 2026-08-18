export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export const IMAGE_ACCEPT = SUPPORTED_IMAGE_TYPES.join(',');

export const SUPPORTED_IMAGE_LABEL = 'JPEG, PNG, or WebP';

export function isSupportedImage(file: File): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}