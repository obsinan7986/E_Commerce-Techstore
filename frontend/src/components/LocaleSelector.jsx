/**
 * LocaleSelector
 * Renders a compact Language + Currency picker that fits inside .header-icons.
 * Uses the existing navbar CSS design tokens (var(--primary), var(--border), etc.)
 * No third-party dropdown library — plain CSS.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation }              from "react-i18next";
import { useCurrency, CURRENCIES }     from "../context/CurrencyContext";
import "../styles/localeSelector.css";

const LANGUAGES = [
  { code: "en", label: "EN",  name: "English"      },
  { code: "am", label: "አማ",  name: "አማርኛ"          },
  { code: "om", label: "OM",  name: "Afaan Oromoo"  },
  { code: "fr", label: "FR",  name: "Français"      },
  { code: "ar", label: "AR",  name: "العربية"        },
];

const LocaleSelector = () => {
  const { i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const langRef = useRef(null);
  const currRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (currRef.current && !currRef.current.contains(e.target)) setCurrOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
    // Apply RTL for Arabic
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    setLangOpen(false);
  };

  const handleCurr = (code) => {
    setCurrency(code);
    setCurrOpen(false);
  };

  return (
    <div className="locale-selector">

      {/* ── Language picker ── */}
      <div className="ls-dropdown" ref={langRef}>
        <button
          className="ls-trigger"
          onClick={() => { setLangOpen(o => !o); setCurrOpen(false); }}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          title="Select language"
        >
          🌐 <span className="ls-label">{currentLang.label}</span>
        </button>
        {langOpen && (
          <ul className="ls-menu" role="listbox">
            {LANGUAGES.map(l => (
              <li
                key={l.code}
                role="option"
                aria-selected={l.code === i18n.language}
                className={`ls-option ${l.code === i18n.language ? "ls-option--active" : ""}`}
                onClick={() => handleLang(l.code)}
              >
                <span className="ls-option-label">{l.label}</span>
                <span className="ls-option-name">{l.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Currency picker ── */}
      <div className="ls-dropdown" ref={currRef}>
        <button
          className="ls-trigger"
          onClick={() => { setCurrOpen(o => !o); setLangOpen(false); }}
          aria-haspopup="listbox"
          aria-expanded={currOpen}
          title="Select currency"
        >
          <span className="ls-label">{currency}</span>
        </button>
        {currOpen && (
          <ul className="ls-menu" role="listbox">
            {Object.entries(CURRENCIES).map(([code, cfg]) => (
              <li
                key={code}
                role="option"
                aria-selected={code === currency}
                className={`ls-option ${code === currency ? "ls-option--active" : ""}`}
                onClick={() => handleCurr(code)}
              >
                <span className="ls-option-label">{cfg.symbol}</span>
                <span className="ls-option-name">{cfg.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default LocaleSelector;
