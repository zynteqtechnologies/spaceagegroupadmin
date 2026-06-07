'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'superadmin' | 'manager'>('superadmin');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
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
          <div className="mb-8">
            <h1 className="text-3xl font-normal text-slate-900 mb-2 tracking-tight">
              Welcome Back {role === 'superadmin' ? 'Admin' : 'Manager'}!
            </h1>
            <p className="text-sm text-slate-400 font-normal">We Are Happy To See You Again</p>
          </div>

          {/* Role Toggle Switch */}
          <div className="bg-slate-100 p-1.5 rounded-full flex items-center mb-10 relative">
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-blue-500 rounded-full shadow-sm transition-transform duration-300 ease-out ${role === 'manager' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'}`} 
            />
            <button
              type="button"
              onClick={() => setRole('superadmin')}
              className={`flex-1 py-3 text-sm font-normal z-10 transition-colors ${role === 'superadmin' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Superadmin
            </button>
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`flex-1 py-3 text-sm font-normal z-10 transition-colors ${role === 'manager' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Manager
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-normal text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email field */}
            <div className="relative">
              <input
                id="email"
                type="email"
                className="w-full pl-5 pr-12 py-4 bg-transparent border border-slate-200 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-normal placeholder:font-normal placeholder:text-slate-400"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>

            {/* Password field */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full pl-5 pr-12 py-4 bg-transparent border border-slate-200 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 text-sm font-normal placeholder:font-normal placeholder:text-slate-400"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between px-2 pt-2 pb-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 scale-0 group-hover:scale-50 transition-transform"></div>
                </div>
                <span className="text-xs font-normal text-slate-500">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs font-normal text-blue-500 hover:text-blue-600 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-4 px-4 rounded-full transition-all font-normal shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
              </button>
            </div>
          </form>
          
        </div>
      </div>

    </div>
  );
}