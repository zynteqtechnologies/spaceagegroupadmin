// app/reset-password/ResetPasswordForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ── Branding panel (shared between both states) ───────────────────────────────
function BrandingPanel() {
  return (
    <div className="md:w-1/2 bg-gradient-to-br from-[#0c74a8] to-[#60c2d1] text-white flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
      <div className="max-w-md text-center md:text-left z-10">
        <h2 className="text-4xl md:text-5xl font-semibold mb-6">Spaceage Group</h2>
        <p className="text-2xl font-light mb-4">
          Building Trust, Delivering Excellence in Real Estate.
        </p>
        <p className="text-md opacity-90 mb-8">
          With 30+ projects, 500+ happy clients, and over 5500+ land bank, we are
          Vadodara&apos;s trusted partner for property investment and development.
        </p>
      </div>
    </div>
  );
}

// ── Main form — uses useSearchParams() safely inside Suspense ─────────────────
export default function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();        // ✅ safe — wrapped in Suspense
  const token        = searchParams.get('token');

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [message, setMessage]                 = useState('');

  useEffect(() => {
    if (!token) setError('Invalid reset link');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setMessage('Password updated successfully. Redirecting to login…');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  // ── Invalid / missing token ───────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <BrandingPanel />
        <div className="md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
          <div className="w-full max-w-md text-center">
            <p className="text-red-500 bg-red-50 border border-red-200 p-4 rounded-lg">
              Invalid or missing reset token.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-[#0c74a8] hover:text-[#094d73] transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset password form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <BrandingPanel />

      <div className="md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="text-[#0c74a8]">Admin</span> Portal
            </h1>
            <p className="text-gray-500 mt-2">Set a new password</p>
          </div>

          {/* Success */}
          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c74a8] focus:border-[#0c74a8] outline-none transition"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c74a8] focus:border-[#0c74a8] outline-none transition"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-br from-[#0c74a8] to-[#60c2d1] text-white py-3 px-4 rounded-lg hover:from-[#0a5f8c] hover:to-[#4fa8b8] focus:ring-4 focus:ring-[#0c74a8]/50 transition font-medium"
            >
              Reset Password
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-[#0c74a8] hover:text-[#094d73] transition"
              >
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}