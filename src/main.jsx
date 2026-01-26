import { createRoot } from "react-dom/client";
import { StrictMode } from 'react';
import App from "./app/App"; // Removed .tsx extension
import "./styles/index.css";

// import { createRoot } from 'react-dom/client';

const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);