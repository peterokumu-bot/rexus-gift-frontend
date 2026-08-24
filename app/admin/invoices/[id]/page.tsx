'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

const C = {
  primary: '#2F6B52',
  primaryDark: '#1e4a38',
  primarySoft: '#e8f2ed',
  dark: '#1f2937',
  row: '#f3f4f6',
};

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const sheetRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<any>(null);
  const [branding, setBranding] = useState<any>({});
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/admin/login');
      return;
    }
    api.get(`/admin/orders/${id}/invoice`).then((r) => setOrder(r.data.data)).catch(() => setError('Could not load invoice'));
    api.get('/settings/branding').then((r) => setBranding(r.data.data || {})).catch(() => {});
  }, [id, router]);

  const downloadPdf = async () => {
    if (!sheetRef.current || !order) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Invoice-${order.orderNumber || id}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF download failed. Run: npm install jspdf html2canvas');
    } finally {
      setDownloading(false);
    }
  };

  if (error) return <div className="min-h-screen flex items-center justify-center"><p>{error}</p></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p>Loading invoice…</p></div>;

  const storeName = branding.storeName || 'Rexus Gift';
  const customerName = order.guestName || [order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') || '—';
  const customerId = order.user?.customerCode || '—';
  const email = order.guestEmail || order.user?.email || '—';
  const phone = order.guestPhone || order.user?.phone || order.deliveryPhone || '—';
  const addressLines = [
    order.deliveryBuilding,
    order.deliveryStreet,
    order.deliveryArea,
    [order.deliveryTown, order.deliveryCounty].filter(Boolean).join(', '),
  ].filter(Boolean);

  const invoiceDate = new Date(order.createdAt);
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 7);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const items = order.items || [];
  const paymentMethod = String(order.paymentMethod || order.payments?.[0]?.method || order.payments?.[0]?.paymentMethod || 'M-Pesa').replace(/_/g, ' ');
  const subtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discountAmount) || 0;
  const delivery = Number(order.deliveryFee) || 0;
  const total = Number(order.total) || 0;

  return (
    <div className="min-h-screen bg-[#d4dde6] py-6">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <Link href={`/admin/orders/${id}`} className="text-sm font-medium hover:underline" style={{ color: C.primary }}>
          ← Back to order
        </Link>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading}
          className="rounded-md px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: C.primary }}
        >
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>

      <div ref={sheetRef} className="relative mx-auto w-full max-w-[210mm] overflow-hidden bg-white shadow-2xl">
        <div className="relative px-9 pt-9 pb-2">
          <div
            className="absolute right-0 top-0 flex h-[78px] w-[240px] flex-col items-center justify-center text-white"
            style={{ background: C.primary, clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}
          >
            <span className="text-[26px] font-black tracking-wide leading-none">INVOICE</span>
            <span className="mt-1 text-[12px] font-medium opacity-95">No. {order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-3 pr-[250px]">
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo} alt="" className="h-12 w-auto max-w-[56px] object-contain" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-md text-lg font-bold text-white" style={{ background: C.primary }}>R</div>
            )}
            <div>
              <p className="text-[18px] font-black tracking-tight text-gray-900 uppercase leading-tight">{storeName}</p>
              <p className="text-[11px] font-medium tracking-widest text-gray-500 uppercase">{branding.tagline || 'Thoughtfully chosen gifts'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 px-9">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Invoice to</p>
            <p className="text-[20px] font-bold text-gray-900 leading-tight">{customerName}</p>
            <p className="mt-0.5 text-[12px] text-gray-500">Customer ID: {customerId}</p>
            <div className="mt-3 space-y-0.5 text-[12px] text-gray-600">
              {addressLines.length ? addressLines.map((line, i) => <p key={i}>{line}</p>) : <p>Nairobi, Kenya</p>}
              <p>{phone}</p>
              <p className="break-all">{email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="mb-3 flex gap-6 text-right text-[12px] text-gray-600">
              <div><p className="text-gray-400">Invoice Date</p><p className="font-semibold text-gray-800">{fmt(invoiceDate)}</p></div>
              <div className="w-px bg-gray-200" />
              <div><p className="text-gray-400">Due Date</p><p className="font-semibold text-gray-800">{fmt(dueDate)}</p></div>
            </div>
            <div className="rounded-xl px-5 py-3 text-right" style={{ background: C.primarySoft }}>
              <p className="text-[11px] font-medium text-gray-500">Total Due:</p>
              <p className="text-[22px] font-black tabular-nums" style={{ color: C.primaryDark }}>{formatKES(total)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 px-9">
          <div
            className="grid grid-cols-[48px_1fr_90px_80px_100px] items-center text-[11px] font-bold uppercase tracking-wide text-white"
            style={{
              background: `linear-gradient(90deg, ${C.dark} 0%, ${C.dark} 38%, ${C.primary} 38%, ${C.primary} 100%)`,
              clipPath: 'polygon(0 0, 100% 0, 97% 100%, 0 100%)',
              padding: '11px 16px',
            }}
          >
            <span>Sl.</span><span>Description</span>
            <span className="text-right">Price</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="mt-1 space-y-1.5">
            {items.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="grid grid-cols-[48px_1fr_90px_80px_100px] items-center px-4 py-3 text-[13px]"
                style={{ background: idx % 2 === 1 ? C.row : 'transparent', borderRadius: idx % 2 === 1 ? '20px' : '0' }}
              >
                <span className="font-semibold text-gray-500">{idx + 1}.</span>
                <div className="pr-2">
                  <p className="font-bold text-gray-900 leading-snug">{item.productName}</p>
                  {item.personalizationMessage && (
                    <p className="mt-0.5 text-[11px] text-gray-500">Personalized message included</p>
                  )}
                </div>
                <span className="text-right tabular-nums text-gray-700">{formatKES(item.unitPrice)}</span>
                <span className="text-center text-gray-700">{item.quantity}</span>
                <span className="text-right font-semibold tabular-nums text-gray-900">{formatKES(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 px-9 pb-2">
          <div>
            <p className="mb-2 text-[14px] font-bold text-gray-900">Payment Methods</p>
            <p className="text-[13px] font-semibold capitalize" style={{ color: C.primary }}>{paymentMethod}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">{order.paymentStatus === 'PAID' ? 'Paid in full' : `Status: ${order.paymentStatus}`}</p>
            <p className="mt-1 text-[11px] text-gray-500">M-Pesa Paybill: 000000 · Account: {storeName}</p>
            <p className="mb-1.5 mt-5 text-[13px] font-bold text-gray-900">Terms &amp; Conditions</p>
            <p className="text-[11px] leading-relaxed text-gray-500">
              Goods remain property of {storeName} until paid in full. Returns within 48 hours if undamaged. Personalized items are non-refundable once produced.
            </p>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between text-gray-600">
              <span>Sub Total</span>
              <span className="tabular-nums font-medium text-gray-900">{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery fee</span>
              <span className="tabular-nums text-gray-900">{formatKES(delivery)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span className="tabular-nums">-{formatKES(discount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between rounded-lg px-4 py-3 text-white" style={{ background: C.primary }}>
              <span className="text-[14px] font-bold">Grand Total :</span>
              <span className="text-[16px] font-black tabular-nums">{formatKES(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 px-9 py-5 text-center text-white" style={{ background: C.primaryDark }}>
          <p className="mb-2 text-[12px] font-bold tracking-[0.15em]">THANK YOU FOR YOUR BUSINESS</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[10px] text-white/85">
            <span>0704 63 4949</span>
            <span>info@rexusgifts.com</span>
            <span>Nairobi, Kenya</span>
          </div>
        </div>
      </div>
    </div>
  );
}