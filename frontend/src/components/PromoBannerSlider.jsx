/**
 * PromoBannerSlider
 *
 * Fetches active promotional banners from /api/banners and renders
 * an auto-rotating slider inside the hero-main area.
 *
 * Behaviour:
 *  - Auto-advances every 5 seconds (pauses on hover)
 *  - Smooth fade + directional slide-in animation (forward/backward aware)
 *  - Prev / Next arrow buttons
 *  - Dot indicators (click to jump)
 *  - Pause on hover, resume on mouse leave
 *  - Falls back to the original static banner if no promos are live
 *  - No flicker, no layout shift, no image distortion
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
  if (path.startsWith("/oict-") || path.startsWith("/categories/") || path.startsWith("/placeholder")) {
    return path;
  }
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

/* ── Static fallback slide (mirrors original HeroBanner) ──── */
const STATIC_SLIDE = {
  _id:         "__static__",
  title:       "New Era of",
  accent:      "Technology",
  subtitle:    "Discover the latest smartphones, laptops and accessories at the best prices.",
  productLink: "/products",
  image:       "/oict-banner.png",
  badge:       { top: "UP TO", number: "20%", unit: "OFF" },
};

/* ── Component ────────────────────────────────────────────── */
const PromoBannerSlider = () => {
  const [slides,    setSlides]    = useState([]);
  const [current,   setCurrent]   = useState(0);
  const [direction, setDirection] = useState("next"); // "next" | "prev"
  const [animating, setAnimating] = useState(false);
  const [paused,    setPaused]    = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const timerRef   = useRef(null);
  const animRef    = useRef(null);

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

  /* ── Navigate with direction awareness ─────────────────── */
  const goTo = useCallback((idx, dir) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setCurrent(idx);
    // Clear the animating flag after the transition completes
    clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setAnimating(false), 600);
  }, [animating]);

  const next = useCallback(() => {
    setSlides(s => {
      const nextIdx = (s.indexOf(s[0]) + 1) % s.length; // placeholder; real logic below
      return s;
    });
    setCurrent(c => {
      const n = (c + 1) % slides.length;
      if (!animating) {
        setDirection("next");
        setAnimating(true);
        clearTimeout(animRef.current);
        animRef.current = setTimeout(() => setAnimating(false), 600);
      }
      return n;
    });
  }, [slides.length, animating]);

  const prev = useCallback(() => {
    setCurrent(c => {
      const n = (c - 1 + slides.length) % slides.length;
      if (!animating) {
        setDirection("prev");
        setAnimating(true);
        clearTimeout(animRef.current);
        animRef.current = setTimeout(() => setAnimating(false), 600);
      }
      return n;
    });
  }, [slides.length, animating]);

  const goToSlide = useCallback((idx) => {
    if (idx === current || animating) return;
    const dir = idx > current ? "next" : "prev";
    setDirection(dir);
    setAnimating(true);
    setCurrent(idx);
    clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setAnimating(false), 600);
  }, [current, animating]);

  /* auto-advance */
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setDirection("next");
      setAnimating(true);
      setCurrent(c => (c + 1) % slides.length);
      clearTimeout(animRef.current);
      animRef.current = setTimeout(() => setAnimating(false), 600);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused]);

  /* cleanup on unmount */
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(animRef.current);
  }, []);

  /* pause on hover */
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  /* skeleton while loading */
  if (!loaded) return <div className="pbs-skeleton" aria-hidden="true" />;

  return (
    <div
      className="pbs-root"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slides */}
      {slides.map((s, i) => {
        const isActive = i === current;
        const isS = s._id === "__static__";

        // Assign animation class:
        // entering: active slide coming in
        // exiting: was active, now inactive (but only the one we just left)
        let slideClass = "pbs-slide";
        if (isActive) {
          slideClass += ` pbs-slide--active pbs-slide--enter-${direction}`;
        }

        return (
          <div
            key={s._id}
            className={slideClass}
            aria-hidden={!isActive}
          >
            {/* Background image layer (promo slides) */}
            {!isS && s.image && (
              <div
                className="pbs-bg"
                style={{ backgroundImage: `url(${imgSrc(s.image)})` }}
              />
            )}

            {/* Content */}
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

      {/* Prev / Next arrows */}
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
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>

      {/* Progress bar — shows time remaining on current slide */}
      {slides.length > 1 && !paused && (
        <div className="pbs-progress" key={`${current}-${paused}`}>
          <div className="pbs-progress-bar" />
        </div>
      )}
    </div>
  );
};

export default PromoBannerSlider;
