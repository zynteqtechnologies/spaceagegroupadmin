'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      setMessage(data.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Branding & Illustration (identical to login/register) */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#0c74a8] to-[#60c2d1] text-white flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-md text-center md:text-left z-10">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6">Spaceage Group</h2>
          <p className="text-2xl md:text-2xl font-light mb-4">Building Trust, Delivering Excellence in Real Estate.</p>
          <p className="text-md opacity-90 mb-8">
            With 30+ projects, 500+ happy clients, and over 5500+ land bank, we are Vadodara&apos;s trusted partner for property investment and development.
          </p>
        </div>
      </div>

      {/* Right side - Forgot Password Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900"><span className="text-[#0c74a8]">Admin</span> Portal</h1>
            <p className="text-gray-500 mt-2">Reset your password</p>
          </div>

          {/* Success message */}
          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0c74a8] focus:border-[#0c74a8] outline-none transition"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-br from-[#0c74a8] to-[#60c2d1] text-white py-3 px-4 rounded-lg hover:from-[#0a5f8c] hover:to-[#4fa8b8] focus:ring-4 focus:ring-[#0c74a8]/50 transition font-medium"
            >
              Send Reset Link
            </button>

            {/* Back to login link */}
            <div className="text-center">
              <Link href="/login" className="text-sm text-[#0c74a8] hover:text-[#094d73] transition">
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}