"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  Flame,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getSession, logout } from "@/lib/authClient";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", Icon: LayoutDashboard },
  { href: "/comments", label: "コメント", Icon: MessageCircle },
  { href: "/discover-trends", label: "トレンドを発見する", Icon: Flame },
  { href: "/ai-content", label: "AIコンテンツ", Icon: Sparkles },
  { href: "/settings", label: "アカウント設定", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState("サンプル");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) setCompanyName(session.companyName);
  }, []);

  // close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const navContent = (
    <>
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-600">
            <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" fill="currentColor" />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 truncate">{companyName}</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm"
        aria-label="メニューを開く"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-end p-2 lg:hidden">
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            aria-label="メニューを閉じる"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-52 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
