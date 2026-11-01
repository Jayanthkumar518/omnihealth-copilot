'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Home, Info, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'About Science', href: '/about', icon: Info },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-50 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            OmniHealth
          </span>
        </div>

        <nav className="space-y-2 flex-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Privacy First
          </div>
          <p className="text-xs text-slate-400">Zero data retention. Client-side browser processing.</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-6 py-3 flex justify-around items-center">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center gap-1 text-xs font-medium ${
                isActive ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              {link.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}