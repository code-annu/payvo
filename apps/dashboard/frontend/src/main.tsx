import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./core/axios/access-token.interceptor";
import "./core/axios/rotate-token.interceptors";
import App from "./App.tsx";
import "./styles/theme.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
