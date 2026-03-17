'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Menu, Search, Sun, Bell,
  User, DollarSign, Settings, ShieldCheck, HelpCircle, LogOut,
} from 'lucide-react';

interface TopbarProps {
  onToggle: () => void;
  user: { name: string; email: string };
}

export default function Topbar({ onToggle, user }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0 relative z-20">
      <button onClick={onToggle} className="text-gray-500 hover:text-gray-800 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-72">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search here..."
          className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
        />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
          <span className="text-lg flex items-center justify-center w-full h-full">🇺🇸</span>
        </button>

        <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
          <Sun size={16} />
        </button>

        <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 relative">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <div className="relative">
          <button onClick={() => setDropdownOpen((v) => !v)}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">Front End Developer</p>
                </div>
              </div>

              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Account</p>
              {[
                { icon: <User size={14} />, label: 'Profile' },
                { icon: <DollarSign size={14} />, label: 'Earning' },
              ].map(({ icon, label }) => (
                <button key={label} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  {icon} {label}
                </button>
              ))}

              <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Settings</p>
              {[
                { icon: <Settings size={14} />, label: 'Account Settings' },
                { icon: <ShieldCheck size={14} />, label: 'Security' },
                { icon: <HelpCircle size={14} />, label: 'Help Center' },
              ].map(({ icon, label }) => (
                <button key={label} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  {icon} {label}
                </button>
              ))}

              <div className="border-t border-gray-100 mt-2 pt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}