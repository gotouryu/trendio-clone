import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trendio Clone - SNS運用効率化プラットフォーム";

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
            <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
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
            Trendio Clone
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#047857",
              marginTop: 20,
              fontWeight: 500,
            }}
          >
            SNS運用効率化プラットフォーム
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#6b7280",
              marginTop: 30,
              maxWidth: 600,
            }}
          >
            Instagram・TikTok 分析 / AIコンテンツ生成 / トレンド発見
          </div>
        </div>
      </div>
    ),
    size,
  );
}
