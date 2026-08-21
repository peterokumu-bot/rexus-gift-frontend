import api from '@/lib/api';

/** Notify header (and any listeners) that cart contents changed */
export function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export async function addToCart(productId: string, quantity = 1) {
  const res = await api.post('/cart/items', { productId, quantity });
  notifyCartUpdated();
  return res.data?.data;
}

export async function updateCartItem(itemId: string, quantity: number) {
  const res = await api.patch(`/cart/items/${itemId}`, { quantity });
  notifyCartUpdated();
  return res.data?.data;
}

export async function removeCartItem(itemId: string) {
  const res = await api.delete(`/cart/items/${itemId}`);
  notifyCartUpdated();
  return res.data?.data;
}
