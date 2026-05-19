"use client";

import { Bar } from "react-chartjs-2";
import { ensureChartRegistered } from "./ChartRegister";
import type { GenderByPeriod } from "@/lib/types";

ensureChartRegistered();

export default function GenderByPeriodChart({
  data,
}: {
  data: GenderByPeriod[];
}) {
  const chartData = {
    labels: data.map((d) => d.ageGroup),
    datasets: [
      {
        label: "男",
        data: data.map((d) => d.male),
        backgroundColor: "#ea580c",
        borderRadius: 4,
      },
      {
        label: "女性",
        data: data.map((d) => d.female),
        backgroundColor: "#fb923c",
        borderRadius: 4,
      },
      {
        label: "他の",
        data: data.map((d) => d.other),
        backgroundColor: "#fed7aa",
        borderRadius: 4,
      },
    ],
  };
  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", align: "end", labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y}%` } },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 80,
            ticks: { callback: (v) => `${v}%` },
            grid: { color: "#f3f4f6" },
          },
          x: { grid: { display: false } },
        },
      }}
    />
  );
}
