import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Karteia - 顧客対応・販売支援 AI プラットフォーム";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)",
          padding: 80,
          alignItems: "center",
          gap: 60,
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 60,
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 30px 80px rgba(16, 185, 129, 0.3)",
          }}
        >
          <svg width="180" height="180" viewBox="0 0 24 24" fill="white">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#064e3b",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            Karteia
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#0f766e",
              marginTop: 20,
              fontWeight: 500,
              maxWidth: 700,
            }}
          >
            中小企業のための 顧客対応・販売支援 AI プラットフォーム
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#6b7280",
              marginTop: 30,
              maxWidth: 700,
            }}
          >
            AI自動応答 / 顧客カルテ / 顧客接点分析
          </div>
        </div>
      </div>
    ),
    size,
  );
}
