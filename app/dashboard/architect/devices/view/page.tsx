"use client";

import { Suspense } from "react";
import DeviceDetailsInner from "./view-inner";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading device…</div>}>
      <DeviceDetailsInner />
    </Suspense>
  );
}
