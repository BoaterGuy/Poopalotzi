import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

console.log('🚀 React mounting with full Poopalotzi app...');

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('✅ Root found, mounting full React app...');
  createRoot(rootElement).render(
    <>
      <App />
      <Toaster />
    </>
  );
  console.log('✅ Full React app mounted!');
} else {
  console.error('❌ Root element not found!');
}
