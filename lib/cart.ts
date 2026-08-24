import api from '@/lib/api';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('sessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('sessionId', id);
  }
  return id;
}

export function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cart-updated'));
  }
}

export async function addToCart(
  productId: string,
  quantity = 1,
  opts?: {
    selectedColor?: string | null;
    selectedSize?: string | null;
    personalizationMessage?: string | null;
    paperColor?: string | null;
  },
) {
  const sessionId = getSessionId();
  const msg = opts?.personalizationMessage?.trim() || undefined;
  const res = await api.post(
    '/cart/items',
    {
      productId,
      quantity,
      selectedColor: opts?.selectedColor || undefined,
      selectedSize: opts?.selectedSize || undefined,
      personalizationMessage: msg,
      message: msg,
      loveMessage: msg,
      paperColor: opts?.paperColor || undefined,
    },
    { headers: { 'x-session-id': sessionId } },
  );
  notifyCartUpdated();
  return res.data.data;
}

export async function fetchCart() {
  const sessionId = getSessionId();
  const res = await api.get('/cart', { headers: { 'x-session-id': sessionId } });
  return res.data.data;
}
