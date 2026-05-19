import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          borderRadius: 36,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
        </svg>
      </div>
    ),
    size,
  );
}
