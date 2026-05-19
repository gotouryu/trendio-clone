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
import { useI18n } from "@/lib/i18n";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState("サンプル");
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), Icon: LayoutDashboard },
    { href: "/comments", label: t("nav.comments"), Icon: MessageCircle },
    { href: "/discover-trends", label: t("nav.trends"), Icon: Flame },
    { href: "/ai-content", label: t("nav.aiContent"), Icon: Sparkles },
    { href: "/settings", label: t("nav.settings"), Icon: Settings },
  ];

  useEffect(() => {
    const session = getSession();
    if (session) setCompanyName(session.companyName);
  }, []);

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
        <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-5 h-5 text-emerald-600 dark:text-emerald-400"
          >
            <path
              d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
          {companyName}
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="主要ナビゲーション">
        {navItems.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-gray-900 dark:bg-emerald-700 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          <span>{t("nav.logout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm no-print"
        aria-label="メニューを開く"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 no-print"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 no-print ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="モバイルナビゲーション"
      >
        <div className="flex justify-end p-2 lg:hidden">
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
            aria-label="メニューを閉じる"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        {navContent}
      </aside>

      <aside
        className="hidden lg:flex w-52 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col h-screen sticky top-0"
        aria-label="ナビゲーション"
      >
        {navContent}
      </aside>
    </>
  );
}
