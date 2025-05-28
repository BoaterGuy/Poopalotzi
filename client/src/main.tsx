import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { registerSW } from "./lib/service-worker";
import { Helmet } from "react-helmet";

// Register service worker for PWA functionality - TEMPORARILY DISABLED FOR TESTING
// registerSW();

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <meta name="theme-color" content="#0B1F3A" />
      <link rel="icon" href="/logo192.png" />
      <link rel="apple-touch-icon" href="/logo192.png" />
      <link rel="manifest" href="/manifest.json" />
    </Helmet>
    <App />
    <Toaster />
  </>
);
