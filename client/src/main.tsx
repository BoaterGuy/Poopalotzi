import { createRoot } from "react-dom/client";
import "./index.css";
import { registerSW } from "./lib/service-worker";
import SimpleAppWithLinks from "./SimpleAppWithLinks";

// Register service worker for PWA functionality
registerSW();

// Initialize the root element
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<SimpleAppWithLinks />);
}
