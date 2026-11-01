import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary, { reportError } from "./components/ErrorBoundary";
import "./styles.css";

window.addEventListener("error", (event) =>
  reportError(event.error ?? event.message, "window"),
);
window.addEventListener("unhandledrejection", (event) =>
  reportError(event.reason, "promise"),
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
