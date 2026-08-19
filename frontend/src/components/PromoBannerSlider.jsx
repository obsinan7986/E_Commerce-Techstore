/**
 * PromoBannerSlider
 *
 * Fetches active promotional banners from /api/banners and renders
 * an auto-rotating slider inside the hero-main area.
 *
 * Behaviour:
 *  - Auto-advances every 5 seconds (pauses on hover)
 *  - Prev / Next arrow buttons
 *  - Dot indicators (click to jump)
 *  - Falls back to the original static banner if no promos are live
 *  - Smooth CSS fade transition between slides
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getActiveBanners } from "../services/adminservice";
import { BASE_URL } from "../services/api";
import "../styles/promoBannerSlider.css";

/* ── helpers ──────────────────────────────────────────────── */
const imgSrc = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

/* ── Static fallback slide (mirrors original HeroBanner) ──── */
const STATIC_SLIDE = {
  _id:         "__static__",
  title:       "New Era of",
  accent:      "Technology",
  subtitle:    "Discover the latest smartphones, laptops and accessories at the best prices.",
  productLink: "/products",
  image:       "/uploads/Samsung-s25.jpg",
  badge:       { top: "UP TO", number: "20%", unit: "OFF" },
};

/* ── Component ────────────────────────────────────────────── */
const PromoBannerSlider = () => {
  const [slides,   setSlides]   = useState([]);
  const [current,  setCurrent]  = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const timerRef = useRef(null);

  /* fetch active banners once on mount */
  useEffect(() => {
    getActiveBanners()
      .then(({ banners }) => {
        setSlides(banners?.length ? banners : [STATIC_SLIDE]);
      })
      .catch(() => {
        setSlides([STATIC_SLIDE]);
      })
      .finally(() => setLoaded(true));
  }, []);

  /* auto-advance */
  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused, next]);

  /* pause timer while user hovers */
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  /* not ready yet — render nothing so layout doesn't jump */
  if (!loaded) return <div className="pbs-skeleton" aria-hidden="true" />;

  const slide = slides[current];
  const isStatic = slide._id === "__static__";

  return (
    <div
      className="pbs-root"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {slides.map((s, i) => {
        const active = i === current;
        const isS = s._id === "__static__";
        return (
          <div
            key={s._id}
            className={`pbs-slide ${active ? "pbs-slide--active" : ""}`}
            aria-hidden={!active}
          >
            {/* background image layer */}
            {!isS && s.image && (
              <div
                className="pbs-bg"
                style={{ backgroundImage: `url(${imgSrc(s.image)})` }}
              />
            )}

            {/* content overlay */}
            <div className="pbs-content">
              {/* Discount badge — static slide only */}
              {isS && (
                <div className="hero-off-badge">
                  <span className="off-label">{s.badge.top}</span>
                  <span className="off-number">{s.badge.number}</span>
                  <span className="off-pct">{s.badge.unit}</span>
                </div>
              )}

              {/* Text */}
              <div className="pbs-text">
                {isS ? (
                  <>
                    <h1>
                      {s.title}
                      <span className="hero-accent"> {s.accent}</span>
                    </h1>
                    <p>{s.subtitle}</p>
                  </>
                ) : (
                  <>
                    {s.title    && <h1>{s.title}</h1>}
                    {s.subtitle && <p>{s.subtitle}</p>}
                  </>
                )}
                <Link
                  to={s.productLink || "/products"}
                  className="hero-cta-btn"
                >
                  Shop Now <FaArrowRight size={13} />
                </Link>
              </div>

              {/* Product / banner image */}
              <div className="pbs-image-wrap">
                <img
                  src={imgSrc(s.image)}
                  alt={s.title || "Promotion"}
                  onError={(e) => { e.target.style.opacity = "0"; }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev / Next arrows — only shown when >1 slide */}
      {slides.length > 1 && (
        <>
          <button
            className="pbs-arrow pbs-arrow--prev"
            onClick={prev}
            aria-label="Previous banner"
          >
            <FaChevronLeft size={14} />
          </button>
          <button
            className="pbs-arrow pbs-arrow--next"
            onClick={next}
            aria-label="Next banner"
          >
            <FaChevronRight size={14} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className="hero-dots" role="tablist" aria-label="Banner slides">
        {slides.map((s, i) => (
          <button
            key={s._id}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            className={`hero-dot ${i === current ? "active" : ""}`}
            onClick={() => setCurrent(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBannerSlider;
