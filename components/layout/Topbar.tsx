'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from './NotificationCenter';
import {
  Menu, Search, Sun, Bell,
  User, Settings, LogOut, ShieldCheck
} from 'lucide-react';

interface TopbarProps {
  onToggle: () => void;
  user: any;
}

export default function Topbar({ onToggle, user }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-18 bg-[#f9fbfd] border-b border-gray-100 flex items-center px-4 lg:px-6 gap-4 shrink-0 relative z-20">
      <button onClick={onToggle} className="text-gray-500 hover:text-gray-800 transition-colors p-1">
        <Menu size={20} />
      </button>

      <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search here..."
          className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <Sun size={22} />
        </button>

        <NotificationCenter />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 hover:bg-gray-50 p-1 pr-2 rounded-full transition-colors border border-transparent hover:border-gray-200"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-xs font-bold text-gray-700 leading-tight">{user?.name}</span>
              <span className="text-[10px] text-gray-400 font-medium capitalize">{user?.role || 'Admin'}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 transform origin-top-right transition-all">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-inner">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex flex-col truncate">
                  <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <div className="mt-1 inline-flex w-max items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                    {user?.role || 'Administrator'}
                  </div>
                </div>
              </div>

              <div className="py-2">
                <p className="px-4 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Account</p>
                <Link
                  href="/users/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <User size={16} /> My Profile
                </Link>
                <Link
                  href="/users/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <Settings size={16} /> Account Settings
                </Link>
                <Link
                  href="/users/security"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <ShieldCheck size={16} /> Security
                </Link>
              </div>

              <div className="border-t border-gray-50 pt-2 pb-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 font-medium transition-colors"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}