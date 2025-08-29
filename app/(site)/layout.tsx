import Navbar from "@/components/site/navbar";
import "../globals.css"; // global CSS import can live here or in root

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
