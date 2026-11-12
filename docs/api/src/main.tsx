import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@stoplight/elements/styles.min.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
