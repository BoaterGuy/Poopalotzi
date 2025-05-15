import { ReactNode } from "react";
import AppNavbar from "../navigation/AppNavbar";
import Footer from "../Footer";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
