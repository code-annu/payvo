import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/styles/theme.css";
import "./core/axios/access-token.interceptor";
import "./core/axios/rotate-token.interceptors";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
