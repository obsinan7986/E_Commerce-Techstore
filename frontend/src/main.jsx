import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import { AuthProvider }             from "./context/AuthContext";
import { CartProvider }             from "./context/CartContext";
import { NotificationProvider }     from "./context/NotificationContext";
import { AdminNotificationProvider } from "./context/AdminNotificationContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <AdminNotificationProvider>
              <App />
            </AdminNotificationProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);