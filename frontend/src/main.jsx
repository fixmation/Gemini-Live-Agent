import React from "react";
import ReactDOM from "react-dom/client";
import AppImmersive from "./AppImmersive.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AppImmersive />
    </ToastProvider>
  </React.StrictMode>
);
