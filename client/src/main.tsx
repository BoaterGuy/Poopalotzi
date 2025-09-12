import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

console.log('🚀 React mounting...');

// CRITICAL: Unregister service worker in development to prevent cached emoji
if ('serviceWorker' in navigator) {
  console.log('🧹 Clearing service worker cache in development...');
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('🗑️ Unregistering service worker:', registration);
      registration.unregister();
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        console.log('🗑️ Deleting cache:', name);
        caches.delete(name);
      });
    });
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('✅ Root found, mounting React app...');
  createRoot(rootElement).render(
    <>
      <App />
      <Toaster />
    </>
  );
  console.log('✅ React app mounted!');
} else {
  console.error('❌ Root element not found!');
}
