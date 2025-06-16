import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { registerSW, addCacheDebugPanel } from "./lib/service-worker";
import { Helmet } from "react-helmet";

// Register service worker for PWA functionality - NETWORK-FIRST STRATEGY
registerSW();

// Force cache invalidation v2.1.0
console.log('Poopalotzi Loading - Build:', '2025-06-16-v2.1.0');

// Add cache debug panel in development
setTimeout(() => {
  addCacheDebugPanel();
}, 1000);

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
