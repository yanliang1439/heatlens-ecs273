import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// StrictMode is fine here and helps catch noisy client-side issues during dev.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
