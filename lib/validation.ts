export function formatPersonName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

export function isValidFullName(input: string): boolean {
  const parts = formatPersonName(input).split(' ').filter(Boolean);
  return parts.length >= 2 && parts.every((p) => p.length >= 2);
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(input.trim());
}

/** Kenya-friendly phone check */
export function isValidPhone(input: string): boolean {
  let raw = input.trim().replace(/[\s\-()]/g, '');
  if (raw.startsWith('+')) raw = raw.slice(1);
  if (raw.startsWith('254') && raw.length >= 12) raw = '0' + raw.slice(3);
  return /^0[17]\d{8}$/.test(raw) || /^\d{9,15}$/.test(raw);
}

export const VIP_META: Record<
  string,
  { label: string; min: number; max: number | null; perks: string; color: string }
> = {
  REGULAR: {
    label: 'Regular',
    min: 0,
    max: 19_999,
    perks: 'Standard customer',
    color: 'bg-gray-100 text-gray-700',
  },
  PRESTIGE: {
    label: 'Prestige',
    min: 20_000,
    max: 49_999,
    perks: 'Early promotions & enhanced privileges',
    color: 'bg-sky-100 text-sky-800',
  },
  EXECUTIVE: {
    label: 'Executive',
    min: 50_000,
    max: 199_999,
    perks: 'Higher Rexo rewards',
    color: 'bg-violet-100 text-violet-800',
  },
  ELITE: {
    label: 'Elite',
    min: 200_000,
    max: 499_999,
    perks: 'Priority delivery & premium treatment',
    color: 'bg-amber-100 text-amber-900',
  },
  DYNASTY: {
    label: 'Dynasty',
    min: 500_000,
    max: null,
    perks: 'Exclusive offers & dedicated Gift Ambassador',
    color: 'bg-[#2F6B52]/15 text-[#1a3b2e]',
  },
};
