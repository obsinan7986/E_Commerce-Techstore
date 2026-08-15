import { Link } from "react-router-dom";
import "../styles/categorysection.css";

const categories = [
  { name: "Smartphones",  image: "/categories/smartphones.jpg"  },
  { name: "Laptops",      image: "/categories/laptops.jpg"      },
  { name: "Tablets",      image: "/categories/tablets.jpg"      },
  { name: "Accessories",  image: "/categories/accessories.jpg"  },
  { name: "Gaming",       image: "/categories/gaming.jpg"       },
  { name: "Headphones",   image: "/categories/headphones.jpg"   },
  { name: "Speakers",     image: "/categories/speakers.jpg"     },
  { name: "Cameras",      image: "/categories/cameras.jpg"      },
  { name: "Televisions",  image: "/categories/televisions.jpg"  },
  { name: "Smartwatches", image: "/categories/smartwatches.jpg" },
];

const EMOJI = {
  Smartphones:  "📱", Laptops: "💻", Tablets: "📲",
  Accessories:  "🎧", Gaming:  "🎮", Headphones: "🎧",
  Speakers:     "🔊", Cameras: "📷", Televisions: "📺",
  Smartwatches: "⌚",
};

const CategorySection = () => (
  <section className="category-section">
    <div className="section-title-block">
      <h2>Shop by Category</h2>
      <Link to="/products">All products →</Link>
    </div>

    <div className="category-grid">
      {categories.map((cat) => (
        <Link
          key={cat.name}
          to={`/category/${encodeURIComponent(cat.name)}`}
          className="category-card"
        >
          <div className="category-icon">
            <img
              className="category-image"
              src={cat.image}
              alt={cat.name}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.textContent = EMOJI[cat.name] || "📦";
                e.target.parentElement.style.fontSize = "26px";
              }}
            />
          </div>
          <h3>{cat.name}</h3>
        </Link>
      ))}
    </div>
  </section>
);

export default CategorySection;
