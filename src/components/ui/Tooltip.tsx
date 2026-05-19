"use client";

import { useState, type ReactNode } from "react";

/**
 * Lightweight CSS-only tooltip (=no portal, no positioning library).
 * Use sparingly; for complex menus use a real popover.
 */
export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  const pos: Record<typeof side, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap px-2 py-1 rounded-md bg-gray-900 text-white text-xs ${pos[side]}`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
