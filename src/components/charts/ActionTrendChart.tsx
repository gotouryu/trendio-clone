"use client";

import { Line } from "react-chartjs-2";
import { ensureChartRegistered } from "./ChartRegister";
import type { ActionTrendPoint } from "@/lib/types";

ensureChartRegistered();

export default function ActionTrendChart({
  data,
}: {
  data: ActionTrendPoint[];
}) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "いいね!",
        data: data.map((d) => d.likes),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.05)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "コメント",
        data: data.map((d) => d.comments),
        borderColor: "#fbbf24",
        backgroundColor: "rgba(251, 191, 36, 0.05)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "セーブ",
        data: data.map((d) => d.saves),
        borderColor: "#fed7aa",
        backgroundColor: "rgba(254, 215, 170, 0.05)",
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "サイトクリック数",
        data: data.map((d) => d.clicks),
        borderColor: "#fde68a",
        backgroundColor: "rgba(253, 230, 138, 0.05)",
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };
  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
          x: { grid: { display: false } },
        },
      }}
    />
  );
}
