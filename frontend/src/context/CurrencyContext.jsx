/**
 * CurrencyContext
 *
 * Provides currency selection + price formatting across the app.
 * - Base prices in the DB are always ETB (Ethiopian Birr).
 * - Conversion happens ONLY in the presentation layer — DB is never touched.
 * - Rates are approximate/static and clearly labeled as such.
 * - Selected currency is persisted in localStorage (key: "currency").
 */
import { createContext, useCallback, useContext, useState } from "react";

/* ── Static exchange rates (ETB base) ───────────────────────
   These are approximate and for display purposes only.
   Label them as "approximate" wherever shown.
   ─────────────────────────────────────────────────────────── */
export const CURRENCIES = {
  ETB: { symbol: "ETB",  rate: 1,        name: "Ethiopian Birr",    decimals: 0 },
  USD: { symbol: "$",    rate: 0.0072,   name: "US Dollar",         decimals: 2 },
  EUR: { symbol: "€",    rate: 0.0066,   name: "Euro",              decimals: 2 },
  GBP: { symbol: "£",    rate: 0.0057,   name: "British Pound",     decimals: 2 },
  AED: { symbol: "AED",  rate: 0.0264,   name: "UAE Dirham",        decimals: 2 },
};

const STORAGE_KEY = "currency";

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && CURRENCIES[saved] ? saved : "ETB";
  });

  const setCurrency = useCallback((code) => {
    if (!CURRENCIES[code]) return;
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  /**
   * Convert an ETB amount to the selected currency and format it.
   * @param {number} etbAmount  — raw ETB price from the DB
   * @returns {string}          — e.g. "$14.50" or "ETB 2,015"
   */
  const formatPrice = useCallback((etbAmount) => {
    if (typeof etbAmount !== "number" || isNaN(etbAmount)) return "—";
    const cfg       = CURRENCIES[currency];
    const converted = etbAmount * cfg.rate;
    const formatted = converted.toLocaleString("en-US", {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    });
    // ETB: symbol after number; others: symbol before
    return currency === "ETB"
      ? `ETB ${formatted}`
      : `${cfg.symbol}${formatted}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
};
