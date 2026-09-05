import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./styles/theme.css";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./core/axios/access-token.interceptor";
import "./core/axios/rotate-token.interceptors";

createRoot(document.getElementById("root")!).render(
    <App />
);
