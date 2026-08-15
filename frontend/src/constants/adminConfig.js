/** Matches backend low-stock threshold in adminController.getLowStockProducts */
export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const PAYMENT_STATUSES = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

export const PRODUCT_CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Tablets",
  "Accessories",
  "Gaming",
  "Headphones",
  "Speakers",
  "Cameras",
  "Televisions",
  "Smartwatches",
];

export const ADMIN_NAV = [
  {
    section: "Main",
    items: [{ label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" }],
  },
  {
    section: "Commerce",
    items: [
      { label: "Orders", path: "/admin/orders", icon: "orders" },
      { label: "Products", path: "/admin/products", icon: "products" },
      { label: "Categories", path: "/admin/categories", icon: "categories" },
      { label: "Inventory", path: "/admin/inventory", icon: "inventory" },
    ],
  },
  {
    section: "Customers",
    items: [
      { label: "Customers", path: "/admin/customers", icon: "customers" },
      { label: "Users", path: "/admin/users", icon: "users" },
    ],
  },
  {
    section: "Finance",
    items: [{ label: "Payments", path: "/admin/payments", icon: "payments" }],
  },
  {
    section: "System",
    items: [{ label: "Settings", path: "/admin/settings", icon: "settings" }],
  },
];

export const ADMIN_PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/inventory": "Inventory",
  "/admin/customers": "Customers",
  "/admin/users": "Users",
  "/admin/payments": "Payments",
  "/admin/settings": "Settings",
};
