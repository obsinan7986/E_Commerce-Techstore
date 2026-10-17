import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// ── i18n — must be imported before any component that uses useTranslation ──
import "./i18n/index.js";
import "./index.css";

import App from "./App";

import { AuthProvider }              from "./context/AuthContext";
import { CartProvider }              from "./context/CartContext";
import { NotificationProvider }      from "./context/NotificationContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import { CurrencyProvider }          from "./context/CurrencyContext";
import {
  PRODUCT_FALLBACK_SVG,
  AVATAR_FALLBACK_SVG,
  DOCUMENT_FALLBACK_SVG,
  RECEIPT_FALLBACK_SVG,
} from "./utils/imageFallback";

// Global capture listener to fallback broken images everywhere in the application
if (typeof window !== "undefined") {
  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target && target.tagName === "IMG" && !target.dataset.fallbackApplied) {
        target.dataset.fallbackApplied = "true";
        target.onerror = null;
        const src = (target.src || "").toLowerCase();
        const alt = (target.alt || "").toLowerCase();
        const cls = (typeof target.className === "string" ? target.className : "").toLowerCase();

        if (src.includes("avatar") || alt.includes("avatar") || alt.includes("profile") || cls.includes("avatar")) {
          target.src = AVATAR_FALLBACK_SVG;
        } else if (src.includes("receipt") || alt.includes("receipt") || src.includes("screenshot") || alt.includes("screenshot") || cls.includes("preview")) {
          target.src = RECEIPT_FALLBACK_SVG;
        } else if (src.includes("kyc") || alt.includes("kyc") || alt.includes("id") || alt.includes("document")) {
          target.src = DOCUMENT_FALLBACK_SVG;
        } else {
          target.src = PRODUCT_FALLBACK_SVG;
        }
      }
    },
    true
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <NotificationProvider>
              <AdminNotificationProvider>
                <App />
              </AdminNotificationProvider>
            </NotificationProvider>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
