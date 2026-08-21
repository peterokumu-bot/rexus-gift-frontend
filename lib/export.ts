const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/** Download admin CSV export (uses JWT from localStorage) */
export async function downloadAdminCsv(
  path: 'orders' | 'customers' | 'products' | 'finance' | 'inventory' | 'vendors',
  filename?: string,
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const endpoint =
    path === 'vendors'
      ? `${API_URL}/admin/vendors/export`
      : `${API_URL}/admin/export/${path}`;

  const res = await fetch(endpoint, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename || `rexus-${path}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
