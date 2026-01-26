import { createRoot } from "react-dom/client";
import App from "./app/App"; // Removed .tsx extension
import "./styles/index.css";

// Removed the "!" (non-null assertion) which is TypeScript-only
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}