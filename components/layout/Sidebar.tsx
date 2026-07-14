'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ImageIcon, FolderKanban,
  FileText, Users, ChevronRight, User2, Aperture, Settings, Milestone, Info, Sparkles, Compass
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
  { label: 'CSR Posts', icon: <Sparkles size={18} />, href: '/csr' },
  { label: 'Services', icon: <Compass size={18} />, href: '/services' },
  { label: 'Our Team', icon: <Users size={18} />, href: '/our-team' },
  { label: 'Users', icon: <User2 size={18} />, href: '/users' },
  {
    label: 'About',
    icon: <Info size={18} />,
    href: '#',
    children: [
      { label: 'Website Counter', icon: <Settings size={16} />, href: '/settings' },
      { label: 'Our Journey', icon: <Milestone size={16} />, href: '/our-journey' },
    ]
  }
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Highlight the most specific matching route
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  return (
    <aside
      className={`h-screen bg-slate-900 flex flex-col transition-all duration-300 shrink-0 overflow-hidden z-50
        ${collapsed ? 'w-0 lg:w-16' : 'w-64'}
        ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        fixed lg:relative lg:flex`}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className={`flex items-center border-b border-blue-500/15 transition-all duration-300
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
          <p className="px-2 mb-2 text-[10px] uppercase tracking-widest text-slate-600 font-semibold">
            Main
          </p>
        )}

        {mainNav.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const parentActive = isParentActive(item);
          const isOpen = openMenus[item.label] || (hasChildren && parentActive);

          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer
                    ${parentActive
                      ? 'bg-blue-500/10 text-blue-500 font-semibold'
                      : 'text-slate-400 hover:bg-blue-500/10 hover:text-white'
                    }`}
                >
                  <span className={`absolute left-0 w-1 h-7 rounded-r-full bg-blue-500 transition-all duration-200
                    ${parentActive ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <span className={`shrink-0 transition-colors ${parentActive ? 'text-blue-500' : ''}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronRight
                        size={14}
                        className={`text-slate-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </>
                  )}
                </button>
                {isOpen && !collapsed && (
                  <div className="pl-4 ml-6 border-l border-slate-800 space-y-1">
                    {item.children?.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          className={`flex items-center gap-2.5 py-2 px-3 text-xs rounded-md transition-all duration-150
                            ${childActive
                              ? 'text-blue-500 font-semibold bg-blue-500/5'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                          {child.icon && <span className="shrink-0">{child.icon}</span>}
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150
                ${active
                  ? 'bg-blue-500/10 text-blue-500 font-semibold'
                  : 'text-slate-400 hover:bg-blue-500/10 hover:text-white'
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
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}