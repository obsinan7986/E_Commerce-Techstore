import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// ── i18n — must be imported before any component that uses useTranslation ──
import "./i18n/index.js";

import App from "./App";

import { AuthProvider }              from "./context/AuthContext";
import { CartProvider }              from "./context/CartContext";
import { NotificationProvider }      from "./context/NotificationContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";
import { CurrencyProvider }          from "./context/CurrencyContext";

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
