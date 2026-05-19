"use client";

import { Doughnut } from "react-chartjs-2";
import { ensureChartRegistered } from "./ChartRegister";
import type { GenderRatio } from "@/lib/types";

ensureChartRegistered();

export default function GenderDoughnutChart({ data }: { data: GenderRatio }) {
  const total = data.female + data.male + data.other;
  const chartData = {
    labels: ["女性", "男", "他の"],
    datasets: [
      {
        data: [data.female, data.male, data.other],
        backgroundColor: ["#fb923c", "#ea580c", "#fed7aa"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  return (
    <div className="relative w-full h-full">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed}%` } },
          },
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-3xl font-bold text-gray-900">{total}</div>
        <div className="text-xs text-gray-500">Total</div>
      </div>
    </div>
  );
}
