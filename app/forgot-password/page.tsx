'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden bg-slate-900 ${plusJakarta.className}`}>
      
      {/* ── Background (Right side Visual) ────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/login-bg.png" 
          alt="Abstract blue liquid background" 
          className="w-full h-full object-cover"
        />

        {/* Glassmorphism footer (Right side only) */}
        <div className="hidden md:block absolute bottom-12 left-[50%] right-12 z-0">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-6 rounded-[2rem] shadow-2xl">
            <p className="text-[10px] text-white/80 font-normal text-center leading-relaxed">
              © 2026 Space Age Group. All rights reserved. <br/>
              Unauthorized use or reproduction of any content or materials from this portal is strictly prohibited. For more information, visit our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* ── Left side (Form Panel) ──────────────────────────────────────── */}
      <div className="relative z-10 w-full md:w-[48%] h-full min-h-screen bg-[#f8f9fa] md:rounded-r-[40px] shadow-[10px_0_40px_rgba(0,0,0,0.2)] flex flex-col justify-center p-8 md:p-16">
        <div className="w-full max-w-[420px] mx-auto">
          
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/spaceage-logo.png" alt="Logo" className="h-8 object-contain" />
          </div>

          {/* Form Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-normal text-slate-900 mb-2 tracking-tight">Forgot Password</h1>
            <p className="text-sm text-slate-400 font-normal">Enter your email and we'll send you a reset link.</p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-normal text-center">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-normal text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email field */}
            <div className="relative">
              <input
                id="email"
                type="email"
                className="w-full pl-5 pr-12 py-4 bg-transparent border border-slate-200 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-normal placeholder:font-normal placeholder:text-slate-400"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-4 px-4 rounded-full transition-all font-normal shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Reset Link"}
              </button>
            </div>

            {/* Back to Login link */}
            <div className="text-center pt-4">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-normal text-slate-500 hover:text-blue-500 transition-colors">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
          
        </div>
      </div>

    </div>
  );
}