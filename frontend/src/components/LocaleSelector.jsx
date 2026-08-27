/**
 * LocaleSelector
 * Language + Currency compact dropdowns in the navbar.
 *
 * On mobile (≤768px) the dropdown uses position:fixed with coordinates
 * calculated from the trigger button's bounding rect — this ensures
 * the menu is never clipped by the navbar's overflow or grid container.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation }          from "react-i18next";
import { useCurrency, CURRENCIES } from "../context/CurrencyContext";
import "../styles/localeSelector.css";

const LANGUAGES = [
  { code: "en", label: "EN",  name: "English"      },
  { code: "am", label: "አማ",  name: "አማርኛ"          },
  { code: "om", label: "OM",  name: "Afaan Oromoo"  },
  { code: "fr", label: "FR",  name: "Français"      },
  { code: "ar", label: "AR",  name: "العربية"        },
];

const isMobile = () => window.innerWidth <= 768;

/* Calculates fixed position for the menu so it stays inside the viewport */
const getMenuStyle = (triggerEl) => {
  if (!triggerEl || !isMobile()) return {};
  const rect    = triggerEl.getBoundingClientRect();
  const menuW   = Math.min(200, window.innerWidth - 16);
  let   right   = window.innerWidth - rect.right;
  // clamp so it doesn't go off the left edge
  right = Math.max(8, Math.min(right, window.innerWidth - menuW - 8));
  return {
    position: "fixed",
    top:      rect.bottom + 6,
    right,
    left:     "auto",
    minWidth: menuW,
  };
};

const Dropdown = ({ trigger, children, open, setOpen, triggerRef }) => {
  const menuRef  = useRef(null);
  const [style, setStyle] = useState({});

  /* Recalculate position whenever the menu opens or viewport resizes */
  useEffect(() => {
    if (open && isMobile()) {
      setStyle(getMenuStyle(triggerRef.current));
    } else {
      setStyle({});
    }
  }, [open, triggerRef]);

  useEffect(() => {
    const onResize = () => {
      if (open && isMobile()) setStyle(getMenuStyle(triggerRef.current));
      else setStyle({});
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, triggerRef]);

  /* Close on outside click / scroll */
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        menuRef.current  && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    document.addEventListener("touchstart", close, { passive: true, capture: true });
    document.addEventListener("scroll",    () => setOpen(false), { passive: true });
    return () => {
      document.removeEventListener("mousedown", close, true);
      document.removeEventListener("touchstart", close, true);
    };
  }, [open, setOpen, triggerRef]);

  return (
    <div className="ls-dropdown">
      {trigger}
      {open && (
        <ul
          ref={menuRef}
          className="ls-menu"
          role="listbox"
          style={style}
        >
          {children}
        </ul>
      )}
    </div>
  );
};

const LocaleSelector = () => {
  const { i18n }              = useTranslation();
  const { currency, setCurrency } = useCurrency();

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const langTriggerRef = useRef(null);
  const currTriggerRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  /* Close Escape key */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setLangOpen(false); setCurrOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLang = useCallback((code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    setLangOpen(false);
  }, [i18n]);

  const handleCurr = useCallback((code) => {
    setCurrency(code);
    setCurrOpen(false);
  }, [setCurrency]);

  return (
    <div className="locale-selector">

      {/* ── Language picker ── */}
      <Dropdown
        open={langOpen}
        setOpen={setLangOpen}
        triggerRef={langTriggerRef}
        trigger={
          <button
            ref={langTriggerRef}
            className="ls-trigger"
            onClick={() => { setLangOpen(o => !o); setCurrOpen(false); }}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            aria-label="Select language"
          >
            🌐 <span className="ls-label">{currentLang.label}</span>
          </button>
        }
      >
        {LANGUAGES.map(l => (
          <li
            key={l.code}
            role="option"
            aria-selected={l.code === i18n.language}
            className={`ls-option ${l.code === i18n.language ? "ls-option--active" : ""}`}
            onClick={() => handleLang(l.code)}
            onTouchEnd={(e) => { e.preventDefault(); handleLang(l.code); }}
          >
            <span className="ls-option-label">{l.label}</span>
            <span className="ls-option-name">{l.name}</span>
          </li>
        ))}
      </Dropdown>

      {/* ── Currency picker ── */}
      <Dropdown
        open={currOpen}
        setOpen={setCurrOpen}
        triggerRef={currTriggerRef}
        trigger={
          <button
            ref={currTriggerRef}
            className="ls-trigger"
            onClick={() => { setCurrOpen(o => !o); setLangOpen(false); }}
            aria-haspopup="listbox"
            aria-expanded={currOpen}
            aria-label="Select currency"
          >
            <span className="ls-label">{currency}</span>
          </button>
        }
      >
        {Object.entries(CURRENCIES).map(([code, cfg]) => (
          <li
            key={code}
            role="option"
            aria-selected={code === currency}
            className={`ls-option ${code === currency ? "ls-option--active" : ""}`}
            onClick={() => handleCurr(code)}
            onTouchEnd={(e) => { e.preventDefault(); handleCurr(code); }}
          >
            <span className="ls-option-label">{cfg.symbol}</span>
            <span className="ls-option-name">{cfg.name}</span>
          </li>
        ))}
      </Dropdown>

    </div>
  );
};

export default LocaleSelector;
