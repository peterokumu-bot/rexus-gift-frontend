'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      const { accessToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success(`Welcome, ${user.firstName}`);
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid staff credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#2F6B52]/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#C4A227]/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-8 w-8 rounded-lg bg-[#2F6B52] flex items-center justify-center text-white text-sm font-bold">
              R
            </span>
            <span className="text-white font-semibold tracking-tight">Rexus Gift</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Staff portal</h1>
          <p className="mt-2 text-sm text-gray-500">Admin & team access only</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/10 bg-[#161b22]/90 backdrop-blur-xl p-8 shadow-2xl space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Work email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/40 focus:border-[#2F6B52]/50"
              placeholder="admin@rexusgift.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/40 focus:border-[#2F6B52]/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2F6B52] hover:bg-[#3a8063] text-white font-medium py-3 text-sm transition disabled:opacity-60"
          >
            {loading ? 'Authenticating…' : 'Enter dashboard'}
          </button>

          <p className="text-[11px] text-center text-gray-600 leading-relaxed">
            Protected area. Unauthorised access is prohibited.
          </p>
        </form>

        <p className="mt-8 text-center text-xs text-gray-600">
          Looking for the shop?{' '}
          <Link href="/login" className="text-gray-400 hover:text-[#5aa882]">
            Customer login
          </Link>
        </p>
      </div>
    </div>
  );
}
