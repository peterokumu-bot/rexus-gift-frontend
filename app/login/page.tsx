'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

declare global {
  interface Window {
    google?: any;
  }
}

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const persist = (accessToken: string, user: any) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const onGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await api.post('/auth/google', { idToken: response.credential });
        const { accessToken, user } = res.data.data;
        if (user.role === 'ADMIN' || user.role === 'STAFF') {
          toast.error('Staff accounts must use the admin portal.');
          return;
        }
        persist(accessToken, user);
        toast.success(`Welcome, ${user.firstName}!`);
        router.push('/account');
        router.refresh();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Google sign-in failed');
      }
    },
    [router],
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onGoogleCredential,
        auto_select: false,
        ux_mode: 'popup',
      });
      const el = document.getElementById('google-btn');
      if (el) {
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        });
      }
    };

    if (window.google?.accounts?.id) {
      init();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [onGoogleCredential]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data.data;
      if (user.role === 'ADMIN' || user.role === 'STAFF') {
        toast.message('Staff account detected — redirecting to admin login');
        router.push('/admin/login');
        return;
      }
      persist(accessToken, user);
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/account');
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#faf9f7]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-gradient-to-br from-[#1a3b2e] via-[#2F6B52] to-[#1e4d3a]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#C4A227]/40 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Rexus <span className="text-[#C4A227]">Gift</span>
          </Link>
          <div>
            <p className="text-[#C4A227] text-sm font-medium tracking-[0.2em] uppercase mb-4">
              Thoughtful gifting
            </p>
            <h2 className="text-4xl xl:text-5xl font-serif font-medium leading-tight max-w-md">
              Gifts that feel personal, every time.
            </h2>
            <p className="mt-6 text-white/70 max-w-sm leading-relaxed">
              Sign in to track orders, earn ☥ Rexo rewards, and manage your wishlist.
            </p>
          </div>
          <p className="text-white/40 text-sm">© {new Date().getFullYear()} Rexus Gift · Kenya</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-10 text-center">
            <Link href="/" className="text-xl font-semibold text-[#1a3b2e]">
              Rexus <span className="text-[#C4A227]">Gift</span>
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif text-[#1a3b2e] font-medium">Welcome back</h1>
          <p className="mt-2 text-gray-500 text-sm">Sign in to your customer account</p>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <div className="mt-8 flex justify-center">
                <div id="google-btn" className="min-h-[44px]" />
              </div>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">or email</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/25 focus:border-[#2F6B52] transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#2F6B52] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2F6B52]/25 focus:border-[#2F6B52] transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2F6B52] hover:bg-[#265a45] text-white font-medium py-3.5 text-sm transition shadow-lg shadow-[#2F6B52]/20 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            New here?{' '}
            <Link href="/register" className="text-[#2F6B52] font-medium hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-gray-400">
            Staff or admin?{' '}
            <Link href="/admin/login" className="text-gray-600 underline-offset-2 hover:underline">
              Admin portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
