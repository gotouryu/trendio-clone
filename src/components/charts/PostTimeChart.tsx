"use client";

import { Bar } from "react-chartjs-2";
import { ensureChartRegistered } from "./ChartRegister";
import type { HourlyEngagement } from "@/lib/types";

ensureChartRegistered();

export default function PostTimeChart({
  data,
}: {
  data: HourlyEngagement[];
}) {
  const chartData = {
    labels: data.map((d) => d.hour.toString().padStart(2, "0") + ":00"),
    datasets: [
      {
        label: "Engagement",
        data: data.map((d) => d.engagement),
        backgroundColor: data.map((d) =>
          d.engagement >= 30 ? "#fb923c" : "#fed7aa",
        ),
        borderRadius: 3,
      },
    ],
  };
  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { display: true, grid: { color: "#f3f4f6" } },
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 9 },
              maxRotation: 0,
              autoSkip: false,
              callback: function (_v, i) {
                return i % 2 === 0 ? data[i]?.hour.toString().padStart(2, "0") + ":00" : "";
              },
            },
          },
        },
      }}
    />
  );
}
