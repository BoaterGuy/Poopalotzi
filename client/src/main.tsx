import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { registerSW, addCacheDebugPanel } from "./lib/service-worker";
import { Helmet } from "react-helmet";

// TEMPORARILY DISABLE SERVICE WORKER TO FIX CACHING ISSUES
// registerSW();

// Force cache invalidation v2.2.0
console.log('Poopalotzi Loading - Build:', '2025-06-16-v2.2.0-FRESH');
document.title = 'Poopalotzi v2.2 LOADING...';

// Force reload if we detect old cache
const APP_VERSION = '2.2.0';
const lastVersion = localStorage.getItem('poopalotzi-version');

if (lastVersion !== APP_VERSION) {
  console.log(`Version update detected: ${lastVersion} -> ${APP_VERSION}`);
  localStorage.setItem('poopalotzi-version', APP_VERSION);
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

// Secondary check for cached content
setTimeout(() => {
  const body = document.querySelector('body');
  const hasNewVersion = body?.textContent?.includes('v2.2') || body?.textContent?.includes('FRESH LOADED');
  
  if (body && !hasNewVersion) {
    console.log('Old cache detected, forcing hard reload...');
    window.location.href = window.location.href + '?v=' + Date.now();
  }
}, 3000);

// Aggressive cache clearing
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('Service worker unregistered');
    });
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
      console.log('Cache deleted:', cacheName);
    });
  });
}

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
