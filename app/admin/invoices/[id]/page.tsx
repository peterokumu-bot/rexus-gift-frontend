'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

const GREEN = '#2F6B52';
const GREEN_DARK = '#1e4a38';

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [branding, setBranding] = useState<any>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/admin/login');
      return;
    }
    api
      .get(`/admin/orders/${id}/invoice`)
      .then((res) => setOrder(res.data.data))
      .catch(() => setError('Could not load invoice'));
    api
      .get('/settings/branding')
      .then((res) => setBranding(res.data.data || {}))
      .catch(() => {});
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading invoice…</p>
      </div>
    );
  }

  const storeName = branding.storeName || 'Rexus Gift Shop';
  const customerName =
    order.guestName ||
    [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') ||
    '—';
  const customerId = order.user?.customerCode || '—';
  const email = order.guestEmail || order.user?.email || '—';
  const phone = order.guestPhone || order.user?.phone || order.deliveryPhone || '—';
  const billAddress = [
    order.deliveryBuilding,
    order.deliveryStreet,
    order.deliveryArea,
    [order.deliveryTown, order.deliveryCounty].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(', ') || 'Nairobi';

  const invoiceDate = new Date(order.createdAt);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 7);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const items = order.items || [];
  const paymentMethod = String(
    order.paymentMethod || order.payments?.[0]?.method || order.payments?.[0]?.paymentMethod || 'M-Pesa',
  ).replace(/_/g, ' ');

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
        }
      `,
        }}
      />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <Link href={`/admin/orders/${id}`} className="text-sm font-medium hover:underline" style={{ color: GREEN }}>
          ← Back to order
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md px-5 py-2.5 text-sm font-semibold text-white"
          style={{ background: GREEN }}
        >
          Download / Print PDF
        </button>
      </div>

      {/* Exact layout from Rexus Gift Shop invoice sample */}
      <div className="sheet mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white shadow-lg">
        {/* Top green bar */}
        <div className="h-2.5 w-full shrink-0" style={{ background: GREEN }} />

        <div className="flex flex-1 flex-col px-10 pb-6 pt-8">
          {/* Brand + INVOICE title */}
          <div className="mb-8 flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              {branding.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logo}
                  alt=""
                  className="h-12 w-auto max-w-[56px] object-contain"
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded text-lg font-bold text-white"
                  style={{ background: GREEN }}
                >
                  R
                </div>
              )}
              <div>
                <p className="text-[18px] font-bold leading-tight text-gray-900">{storeName}</p>
                <p className="text-[13px] text-gray-500">Nairobi</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[28px] font-bold tracking-wide" style={{ color: GREEN }}>
                INVOICE
              </p>
              <div className="mt-1 space-y-0.5 text-[12px] text-gray-600">
                <p>
                  <span className="text-gray-500">Invoice # </span>
                  <span className="font-semibold text-gray-800">{order.orderNumber}</span>
                </p>
                <p>
                  <span className="text-gray-500">Date: </span>
                  {fmtDate(invoiceDate)}
                </p>
                <p>
                  <span className="text-gray-500">Due: </span>
                  {fmtDate(dueDate)}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 border-t border-gray-200" />

          {/* FROM / BILL TO */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">From</p>
              <p className="text-[14px] font-bold text-gray-900">{storeName}</p>
              <p className="text-[13px] text-gray-600">info@rexusgifts.com</p>
              <p className="text-[13px] text-gray-600">0704 63 4949</p>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Bill to</p>
              <p className="text-[14px] font-bold text-gray-900">{customerName}</p>
              <p className="text-[13px] text-gray-600">
                Customer ID: <span className="font-mono font-medium">{customerId}</span>
              </p>
              <p className="text-[13px] text-gray-600">{billAddress}</p>
              <p className="text-[13px] text-gray-600">{phone}</p>
              <p className="text-[13px] text-gray-600 break-all">{email}</p>
            </div>
          </div>

          {/* Line items table */}
          <table className="mb-2 w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ background: GREEN }}>
                <th className="w-10 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                  Description
                </th>
                <th className="w-16 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
                  Qty
                </th>
                <th className="w-28 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-white">
                  Unit price
                </th>
                <th className="w-28 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-white">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr
                  key={item.id}
                  style={{ background: idx % 2 === 1 ? '#f3f4f6' : '#ffffff' }}
                >
                  <td className="px-3 py-2.5 text-gray-600">{idx + 1}</td>
                  <td className="px-3 py-2.5 text-gray-800">
                    <span className="font-medium">{item.productName}</span>
                    {item.personalizationMessage && (
                      <span className="mt-0.5 block text-[11px] italic text-gray-500">
                        Personalized message included
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {formatKES(item.unitPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-gray-900">
                    {formatKES(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mb-8 flex justify-end">
            <div className="w-56 space-y-1.5 text-[13px]">
              <div className="flex justify-between border-t border-gray-200 pt-2 text-gray-600">
                <span>Subtotal</span>
                <span className="tabular-nums text-gray-900">{formatKES(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span className="tabular-nums">-{formatKES(order.discountAmount)}</span>
                </div>
              )}
              {Number(order.deliveryFee) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="tabular-nums">{formatKES(order.deliveryFee)}</span>
                </div>
              )}
              <div
                className="flex justify-between border-t-2 pt-2 text-[15px] font-bold"
                style={{ borderColor: GREEN, color: GREEN }}
              >
                <span>TOTAL</span>
                <span className="tabular-nums">{formatKES(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200" />

          {/* Payment + notes */}
          <div className="mb-8 space-y-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: GREEN }}>
                Payment details
              </p>
              <p className="text-[13px] text-gray-700">
                {paymentMethod}
                {order.paymentStatus === 'PAID' ? ' · Paid in full' : ` · Status: ${order.paymentStatus}`}
              </p>
              <p className="text-[13px] text-gray-600">
                M-Pesa Paybill: 000000 | Account: {storeName}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: GREEN }}>
                Notes
              </p>
              <p className="text-[13px] text-gray-600">
                Thank you for shopping with us! All sales are final unless item is faulty.
              </p>
            </div>
          </div>

          <div className="mt-auto" />
        </div>

        {/* Footer */}
        <div className="mt-auto px-10 pb-4 text-center text-[11px] text-gray-400">
          {storeName} &nbsp;|&nbsp; info@rexusgifts.com &nbsp;|&nbsp; 0704 63 4949 &nbsp;|&nbsp; Nairobi
        </div>

        {/* Bottom green bar */}
        <div className="h-2.5 w-full shrink-0" style={{ background: GREEN }} />
      </div>
    </div>
  );
}
