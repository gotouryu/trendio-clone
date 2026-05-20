"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Heart,
} from "lucide-react";
import { getSession, logout } from "@/lib/authClient";
import { useI18n } from "@/lib/i18n";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Karteia の主要4機能(=共P-01 該当機能、お客様向けラベルに統一)
  // ラベルは i18n 経由(=Settings の言語切替で英語化、screencast 撮影に必須)
  const navItems = [
    { href: "/dashboard", labelKey: "nav.dashboard", Icon: LayoutDashboard },
    { href: "/comments", labelKey: "nav.comments", Icon: MessageCircle },
    { href: "/customers", labelKey: "nav.customers", Icon: Users },
    { href: "/settings", labelKey: "nav.settings", Icon: Settings },
  ];

  useEffect(() => {
    const session = getSession();
    if (session) setCompanyName(session.companyName ?? null);
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
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
          }}
        >
          <Heart className="w-5 h-5 text-white" fill="currentColor" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-base tracking-wide">
            Karteia
          </div>
          {companyName && (
            <div
              className="text-xs truncate"
              style={{ color: "var(--sidebar-fg)" }}
            >
              {companyName}
            </div>
          )}
        </div>
      </div>

      <nav
        className="flex-1 px-3 py-2 space-y-1"
        aria-label={t("nav.main")}
      >
        {navItems.map(({ href, labelKey, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "#0d9488" : "transparent",
                color: active ? "#ffffff" : "var(--sidebar-fg)",
                fontWeight: active ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon className="w-4 h-4" aria-hidden />
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          style={{ color: "var(--sidebar-fg)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
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
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-white border flex items-center justify-center shadow-sm no-print"
        style={{ borderColor: "var(--card-border)" }}
        aria-label={t("nav.openMenu")}
      >
        <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 no-print"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-200 no-print ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar-bg)" }}
        aria-label={t("nav.mobileNav")}
      >
        <div className="flex justify-end p-2 lg:hidden">
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/10"
            aria-label={t("nav.closeMenu")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {navContent}
      </aside>

      <aside
        className="hidden lg:flex w-56 flex-col h-screen sticky top-0"
        style={{ background: "var(--sidebar-bg)" }}
        aria-label={t("nav.main")}
      >
        {navContent}
      </aside>
    </>
  );
}
