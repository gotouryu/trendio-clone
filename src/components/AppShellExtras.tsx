"use client";

import ServiceWorkerRegister from "./ServiceWorkerRegister";
import DebugPanel from "./DebugPanel";

export default function AppShellExtras() {
  return (
    <>
      <ServiceWorkerRegister />
      <DebugPanel />
    </>
  );
}
