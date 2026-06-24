/** Default placeholder when product/category/subcategory images are missing or fail to load. */
export const DEFAULT_PRODUCT_IMAGE = '/images/dehault_image.png';

export function resolveProductImage(url) {
  return url || DEFAULT_PRODUCT_IMAGE;
}

export function onProductImageError(event) {
  const img = event?.target;
  if (!img || img.src.endsWith(DEFAULT_PRODUCT_IMAGE)) return;
  img.onerror = null;
  img.src = DEFAULT_PRODUCT_IMAGE;
}
