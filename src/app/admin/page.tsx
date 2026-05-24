"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Ban,
  CheckCircle2,
  KeyRound,
  Copy,
  LogOut,
  Users,
  Activity,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getSession, isAdmin, logout } from "@/lib/authClient";
import { useToast } from "@/components/providers/ToasterProvider";
import { useI18n } from "@/lib/i18n";

type Customer = {
  id: string;
  company_name: string;
  role: string;
  status: string;
  registered_at: string;
  last_login_at: string | null;
  logins_30d: number;
  days_since_register: number;
};

const PAGE_SIZE = 50;

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [active30dCount, setActive30dCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCred, setNewCred] = useState<{ email: string; password: string } | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(data.customers ?? []);
      setTotalCount(data.totalCount ?? 0);
      setActive30dCount(data.active30dCount ?? 0);
      setSuspendedCount(data.suspendedCount ?? 0);
    } catch (e) {
      toast(e instanceof Error ? e.message : t("admin.toast.fetchFail"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast, t]);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/portal-helix-2026/login");
      return;
    }
    fetchCustomers();
  }, [fetchCustomers, router]);

  async function handleLogout() {
    await logout();
    router.push("/portal-helix-2026/login");
  }

  async function createCustomer(email: string, companyName: string) {
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? t("admin.toast.createFail"), "error");
      return;
    }
    setNewCred({ email: data.email, password: data.initialPassword });
    setShowAdd(false);
    fetchCustomers();
    toast(t("admin.toast.created"), "success");
  }

  async function suspendResume(id: string, current: string) {
    const action = current === "suspended" ? "resume" : "suspend";
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      toast(t("admin.toast.opFail"), "error");
      return;
    }
    toast(
      action === "suspend"
        ? t("admin.toast.suspended")
        : t("admin.toast.resumed"),
      "success",
    );
    fetchCustomers();
  }

  async function resetPassword(id: string, email: string) {
    if (!confirm(t("admin.confirmResetPassword", { email }))) return;
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? t("admin.toast.resetFail"), "error");
      return;
    }
    setNewCred({ email, password: data.newPassword });
  }

  function copyAll(creds: { email: string; password: string }) {
    navigator.clipboard.writeText(
      `Karteia Admin Login\nURL: ${typeof window !== "undefined" ? window.location.origin : ""}/login\nEmail: ${creds.email}\nPassword: ${creds.password}`,
    );
    toast(t("admin.toast.copied"), "success");
    // 60秒後にクリップボード自動クリア(=セキュリティ強化)
    setTimeout(() => {
      try {
        navigator.clipboard.writeText("");
      } catch {
        // ignore
      }
    }, 60_000);
  }

  const session = typeof window !== "undefined" ? getSession() : null;
  const dateLocale = locale === "en" ? "en-US" : "ja-JP";
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("admin.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("admin.loggedInAs", { email: session?.email ?? "" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            {t("admin.refresh")}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            {t("nav.logout")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5 text-emerald-500" />} label={t("admin.stats.total")} value={totalCount} />
        <StatCard icon={<Activity className="w-5 h-5 text-blue-500" />} label={t("admin.stats.active30d")} value={active30dCount} />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />} label={t("admin.stats.suspended")} value={suspendedCount} />
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={t("admin.search")}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={t("common.search")}
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t("admin.newCustomer")}
        </button>
      </div>

      {/* Customer table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("admin.tableCaption")}</caption>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs uppercase">
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.name")}</th>
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.status")}</th>
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.registered")}</th>
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.lastLogin")}</th>
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.logins30d")}</th>
                <th scope="col" className="text-left px-4 py-3">{t("admin.table.col.days")}</th>
                <th scope="col" className="text-right px-4 py-3">{t("admin.table.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    {t("admin.loading")}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {t("admin.empty")}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{c.company_name}</td>
                    <td className="px-4 py-3">
                      {c.status === "suspended" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">{t("admin.row.suspended")}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{t("admin.row.active")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(c.registered_at).toLocaleDateString(dateLocale)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.last_login_at ? new Date(c.last_login_at).toLocaleString(dateLocale, { dateStyle: "short", timeStyle: "short" }) : t("admin.row.neverLogin")}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t("admin.row.logins", { n: c.logins_30d })}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t("admin.row.days", { n: c.days_since_register })}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => suspendResume(c.id, c.status)}
                          className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${c.status === "suspended" ? "text-emerald-500" : "text-amber-500"}`}
                          title={c.status === "suspended" ? t("admin.row.titleResume") : t("admin.row.titleSuspend")}
                          aria-label={c.status === "suspended" ? t("admin.row.titleResume") : t("admin.row.titleSuspend")}
                        >
                          {c.status === "suspended" ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => resetPassword(c.id, c.company_name)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
                          title={t("admin.row.titleResetPassword")}
                          aria-label={t("admin.row.titleResetPassword")}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
	        </div>
	      </div>

	      <div className="flex items-center justify-end gap-2 mt-4 text-sm text-gray-600 dark:text-gray-300">
	        <span>
	          {page + 1} / {totalPages}
	        </span>
	        <button
	          onClick={() => setPage((p) => Math.max(0, p - 1))}
	          disabled={page === 0 || loading}
	          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
	          aria-label="Previous page"
	          title="Previous page"
	        >
	          <ChevronLeft className="w-4 h-4" />
	        </button>
	        <button
	          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
	          disabled={page >= totalPages - 1 || loading}
	          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
	          aria-label="Next page"
	          title="Next page"
	        >
	          <ChevronRight className="w-4 h-4" />
	        </button>
	      </div>

	      {/* Add customer modal */}
      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onCreate={createCustomer} />}

      {/* New credentials modal (shown once) */}
      {newCred && <CredentialsModal cred={newCred} onClose={() => setNewCred(null)} onCopy={copyAll} />}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  );
}

function CredentialsModal({
  cred,
  onClose,
  onCopy,
}: {
  cred: { email: string; password: string };
  onClose: () => void;
  onCopy: (c: { email: string; password: string }) => void;
}) {
  const { t } = useI18n();
  // Escape キーで閉じる
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cred-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h3
            id="cred-modal-title"
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            {t("admin.cred.issued")}
          </h3>
        </div>
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200 mb-4">
          {t("admin.cred.warning")}
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</div>
            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">{cred.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Password</div>
            <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">{cred.password}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onCopy(cred)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            {t("admin.cred.copyAll")}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
          >
            {t("admin.cred.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCustomerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (email: string, companyName: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Escape キーで閉じる
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(email, companyName);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3
          id="add-modal-title"
          className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4"
        >
          {t("admin.modal.title")}
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-modal-company"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("admin.modal.companyLabel")}
            </label>
            <input
              id="admin-modal-company"
              name="company"
              required
              autoFocus
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t("admin.modal.companyPlaceholder")}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="admin-modal-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t("admin.modal.emailLabel")}
            </label>
            <input
              id="admin-modal-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("admin.modal.emailPlaceholder")}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("admin.modal.emailHelp")}
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
            >
              {t("admin.modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
            >
              {submitting ? t("admin.modal.submitting") : t("admin.modal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
