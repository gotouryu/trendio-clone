"use client";

import { Line } from "react-chartjs-2";
import { ensureChartRegistered } from "./ChartRegister";
import type { FollowerTrendPoint } from "@/lib/types";

ensureChartRegistered();

export default function FollowerTrendChart({
  data,
}: {
  data: FollowerTrendPoint[];
}) {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Followers",
        data: data.map((d) => d.followers),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#f97316",
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
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
