'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatKES } from '@/lib/utils';

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/wallet')
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Could not load wallet'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  const deposit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await api.post('/wallet/deposit', { amount: n });
      toast.success('Wallet topped up');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    }
  };

  if (loading) {
    return <div className="max-w-lg mx-auto px-4 py-16 h-40 bg-gray-100 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <Link href="/account" className="text-sm text-[#2F6B52] hover:underline">← Account</Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Wallet & Rexo</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Wallet</p>
          <p className="text-xl font-bold text-[#2F6B52]">{formatKES(data?.walletBalance || 0)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Rexo</p>
          <p className="text-xl font-bold">☥ {data?.rexoBalance || 0}</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>{data?.rules?.earn}</p>
        <p>{data?.rules?.redeem}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900">Top up wallet</h2>
        <p className="text-xs text-gray-500 mt-1">Demo top-up (connect M-Pesa in production)</p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
          />
          <button onClick={deposit} className="px-5 rounded-xl bg-[#2F6B52] text-white text-sm font-medium">
            Deposit
          </button>
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-gray-900">Activity</h2>
      <ul className="mt-3 divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {(data?.transactions || []).length === 0 && (
          <li className="p-4 text-sm text-gray-500">No transactions yet</li>
        )}
        {(data?.transactions || []).map((t: any) => (
          <li key={t.id} className="p-4 flex justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-gray-900">{t.description || t.type}</p>
              <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
            </div>
            <p className={`font-semibold ${t.type.includes('REXO') ? '' : 'text-[#2F6B52]'}`}>
              {t.currency === 'REXO' ? `☥ ${t.amount}` : formatKES(t.amount)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
