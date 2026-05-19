"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getSession, isAdmin, logout } from "@/lib/authClient";
import { useToast } from "@/components/providers/ToasterProvider";

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

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newCred, setNewCred] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/portal-helix-2026/login");
      return;
    }
    fetchCustomers();
  }, [router]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomers(data.customers ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "取得失敗", "error");
    } finally {
      setLoading(false);
    }
  }

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
      toast(data.error ?? "作成失敗", "error");
      return;
    }
    setNewCred({ email: data.email, password: data.initialPassword });
    setShowAdd(false);
    fetchCustomers();
    toast("お客様アカウントを発行しました", "success");
  }

  async function suspendResume(id: string, current: string) {
    const action = current === "suspended" ? "resume" : "suspend";
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      toast("操作失敗", "error");
      return;
    }
    toast(action === "suspend" ? "停止しました" : "再開しました", "success");
    fetchCustomers();
  }

  async function resetPassword(id: string, email: string) {
    if (!confirm(`${email} のパスワードを再発行しますか?`)) return;
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset-password" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "失敗", "error");
      return;
    }
    setNewCred({ email, password: data.newPassword });
  }

  function copyAll(creds: { email: string; password: string }) {
    navigator.clipboard.writeText(
      `Trendio Clone 管理画面ログイン情報\nURL: ${typeof window !== "undefined" ? window.location.origin : ""}/login\nEmail: ${creds.email}\nPassword: ${creds.password}`,
    );
    toast("クリップボードにコピーしました", "success");
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.company_name.includes(search) ||
      c.id.includes(search),
  );

  const session = typeof window !== "undefined" ? getSession() : null;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            管理ポータル
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {session?.email} としてログイン中
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            更新
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users className="w-5 h-5 text-emerald-500" />} label="お客様総数" value={customers.length} />
        <StatCard icon={<Activity className="w-5 h-5 text-blue-500" />} label="アクティブ(30日内ログイン)" value={customers.filter(c => c.logins_30d > 0).length} />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-500" />} label="停止中" value={customers.filter(c => c.status === "suspended").length} />
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="会社名・IDで検索..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新規お客様を発行
        </button>
      </div>

      {/* Customer table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs uppercase">
                <th className="text-left px-4 py-3">お客様名</th>
                <th className="text-left px-4 py-3">状態</th>
                <th className="text-left px-4 py-3">登録日</th>
                <th className="text-left px-4 py-3">最終LG</th>
                <th className="text-left px-4 py-3">30日LG</th>
                <th className="text-left px-4 py-3">経過日数</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    読込中...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    お客様がいません。「新規お客様を発行」から追加してください。
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{c.company_name}</td>
                    <td className="px-4 py-3">
                      {c.status === "suspended" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">停止中</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">運用中</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(c.registered_at).toLocaleDateString("ja-JP")}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.last_login_at ? new Date(c.last_login_at).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" }) : "未ログイン"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.logins_30d}回</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.days_since_register}日</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => suspendResume(c.id, c.status)}
                          className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${c.status === "suspended" ? "text-emerald-500" : "text-amber-500"}`}
                          title={c.status === "suspended" ? "再開" : "停止"}
                        >
                          {c.status === "suspended" ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => resetPassword(c.id, c.company_name)}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
                          title="パスワード再発行"
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

      {/* Add customer modal */}
      {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onCreate={createCustomer} />}

      {/* New credentials modal (shown once) */}
      {newCred && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                発行完了
              </h3>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200 mb-4">
              ⚠️ パスワードはこの画面でしか表示されません。お客様に配布する前に必ずコピーしてください。
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</div>
                <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">{newCred.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Password</div>
                <div className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">{newCred.password}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyAll(newCred)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                配布用テキストをコピー
              </button>
              <button
                onClick={() => setNewCred(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
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

function AddCustomerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (email: string, companyName: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          新規お客様を発行
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              お客様の会社名
            </label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社○○"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              パスワードは自動生成され、発行後一度だけ表示されます
            </p>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
            >
              {submitting ? "発行中..." : "発行する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

