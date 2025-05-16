import { createRoot } from "react-dom/client";
import "./index.css";
import { registerSW } from "./lib/service-worker";
import SimpleApp from "./SimpleApp";

// Register service worker for PWA functionality
registerSW();

createRoot(document.getElementById("root")!).render(<SimpleApp />);
