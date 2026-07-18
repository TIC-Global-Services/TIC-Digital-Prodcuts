// Maps a Product.id to its cover image in /public. Falls back to no image
// for products added later that haven't been given cover art yet.
const COVER_IMAGES: Record<string, string> = {
  "uiux-playbook-ebook": "/ebook/uiux_book_cover.jpg",
};

export function getProductCoverImage(productId: string): string | null {
  return COVER_IMAGES[productId] ?? null;
}
