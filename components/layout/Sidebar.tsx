'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ImageIcon, FolderKanban,
  FileText, Users, ChevronRight, User2, Aperture
} from 'lucide-react';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  children?: NavItem[];
};

const mainNav: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
  { label: 'Hero Image', icon: <ImageIcon size={18} />, href: '/hero-image' },
  { label: 'Projects', icon: <FolderKanban size={18} />, href: '/projects', children: [] },
  { label: 'Media', icon: <Aperture size={18} />, href: '/media' },
  { label: 'Blog', icon: <FileText size={18} />, href: '/blog' },
  { label: 'Our Team', icon: <Users size={18} />, href: '/our-team' },
  { label: 'Users', icon: <User2 size={18} />, href: '/users' },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  // Highlight the most specific matching route
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`h-screen bg-[#0f1623] flex flex-col transition-all duration-300 shrink-0 overflow-hidden z-50
        ${collapsed ? 'w-0 lg:w-16' : 'w-64'}
        ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        fixed lg:relative lg:flex`}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-white/10 transition-all duration-300
        ${collapsed ? 'justify-center px-3 py-4' : 'px-4 py-4'}`}
      >
        {collapsed ? (
          <div className="w-8 h-8 relative shrink-0">
            <Image
              src="/spaceage-logo-half.png"
              alt="Space Age Group"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="relative h-10 w-full">
            <Image
              src="/spaceage-logo.png"
              alt="Space Age Group"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {!collapsed && (
          <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Main
          </p>
        )}

        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150
                ${active
                  ? 'bg-white/5 text-blue-500 font-semibold'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              {/* Active indicator bar */}
              <span className={`absolute left-0 w-1 h-7 rounded-r-full bg-blue-500 transition-all duration-200
                ${active ? 'opacity-100' : 'opacity-0'}`}
              />

              <span className={`shrink-0 transition-colors ${active ? 'text-blue-500' : ''}`}>
                {item.icon}
              </span>

              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>

                  {item.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-semibold
                      ${typeof item.badge === 'string'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                      }`}>
                      {item.badge}
                    </span>
                  )}

                  {item.children && (
                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}