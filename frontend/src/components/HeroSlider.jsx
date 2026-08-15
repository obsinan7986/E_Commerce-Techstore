import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import "../styles/heroslider.css";

const HeroSlider = () => {
  const slides = [
    {
      title: "Latest iPhone Collection",
      subtitle: "Up to 30% OFF",
      image: "/banners/iphone-banner.jpg",
    },
    {
      title: "Gaming Laptops",
      subtitle: "Best Performance",
      image: "/banners/laptop-banner.jpg",
    },
    {
      title: "Premium Audio",
      subtitle: "Sony • JBL • Marshall",
      image: "/banners/headphone-banner.jpg",
    },
  ];

  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={{ delay: 3500 }}
      pagination={{ clickable: true }}
      loop
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          >
            <div className="hero-content">
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>

              <button>Shop Now</button>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default HeroSlider;