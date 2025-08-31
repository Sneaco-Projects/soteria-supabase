// /app/(site)/layout.tsx
import Navbar from "@/components/site/navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* push content below your fixed/top navbar */}
      <main className="flex-1 pt-20">{children}</main>
    </div>
  );
}
