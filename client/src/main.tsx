import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { Helmet } from "react-helmet";

// Simple loading indicator
console.log('Poopalotzi Loading - Build:', '2025-06-16-v2.2.0-STABLE');
document.title = 'Poopalotzi - Marina Management';

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
