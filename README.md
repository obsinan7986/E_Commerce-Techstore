# OICT TechStore

A full-stack e-commerce web application for browsing, purchasing, and managing technology products such as smartphones, laptops, tablets, accessories, smart watches, cameras, headphones, and gaming products.

> **Project:** OICT TechStore  
> **Architecture:** Full-stack web application  
> **Frontend:** React + Vite  
> **Backend:** Node.js + Express.js  
> **Database:** MongoDB + Mongoose

---

## 1. Project Overview

OICT TechStore is an e-commerce platform designed to provide customers with a complete online shopping experience.

Customers can:

- Browse technology products
- Search for products
- Browse products by category
- View product details
- Add products to a shopping cart
- Increase or decrease product quantities
- Manage their cart
- Proceed to checkout
- Enter shipping information
- Select a payment method
- Place orders
- View their previous orders
- View individual order details
- Cancel eligible orders
- Track order/payment status

Administrators can manage the store through the administrative functionality, including products, orders, payments, and banners.

---

## 2. Main Features

### Customer Features

- User registration and login
- Authentication and protected routes
- Product browsing
- Product categories
- Product search
- Shopping cart
- Cart quantity management
- Wishlist
- Checkout
- Shipping address collection
- Order creation
- Order history
- Order details
- Order cancellation
- Payment status tracking

### Payment Features

The project is structured to support:

- Chapa
- Telebirr
- CBE Birr
- M-Pesa
- Awash Bank
- Cash on Delivery

Chapa payment initialization and verification are implemented through the backend payment controller.

> **Important:** Payment methods such as Telebirr, CBE Birr, M-Pesa, and Awash Bank should only be described as fully integrated after their respective official payment APIs/gateways have actually been implemented and tested.

### Admin Features

The backend contains functionality for:

- Product administration
- Order administration
- Order status management
- Payment information
- Banner management
- Administrative API services

---

## 3. Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- React Icons
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT-based authentication
- Axios
- Chapa payment API integration

### Development and Testing

- Visual Studio Code
- Git
- GitHub
- Postman
- MongoDB

---

## 4. Project Structure

```text
OICT-TechStore/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── postman/
│   └── API testing files
│
├── .gitignore
└── README.md
```

---

## 5. Backend Architecture

The backend follows a modular Express.js architecture.

### Routes

Routes define the API endpoints and connect HTTP requests to controller functions.

Examples include:

```text
/api/auth
/api/products
/api/cart
/api/orders
/api/payments
/api/admin
```

### Controllers

Controllers contain the main application/business logic.

Examples:

```text
authController.js
productController.js
cartController.js
orderController.js
paymentController.js
```

### Models

Mongoose models define the MongoDB data structures.

Important models include:

```text
User
Product
Cart
Order
```

### Middleware

Middleware handles cross-cutting functionality such as authentication and request protection.

Example:

```text
authMiddleware.js
```

The `protect` middleware is used to restrict authenticated API endpoints.

### Services

Frontend service modules communicate with the backend API.

For example:

```text
api.js
cartService.js
orderService.js
adminservice.js
```

---

## 6. Authentication Flow

The application uses protected API routes for authenticated operations.

A typical flow is:

```text
User Login
    ↓
Authentication API
    ↓
JWT / Authentication Token
    ↓
Frontend stores authentication state
    ↓
Axios API requests include authentication
    ↓
Backend protect middleware
    ↓
req.user
    ↓
Controller
```

Protected operations include:

- Cart operations
- Checkout
- Creating orders
- Viewing personal orders
- Viewing protected order details
- Protected payment operations
- Administrative operations

---

## 7. Shopping Cart Flow

The cart is associated with the authenticated user.

Typical flow:

```text
Product
   ↓
Add to Cart
   ↓
Cart API
   ↓
MongoDB Cart
   ↓
CartContext
   ↓
Navbar Cart Count
```

The frontend `CartContext` exposes the cart count through:

```javascript
const { cartCount } = useCart();
```

The cart count is calculated from the quantities of items in the user's cart.

For example, if the cart contains:

```text
Product A × 2
Product B × 3
```

the cart count is:

```text
5
```

---

## 8. Checkout and Order Flow

The checkout process follows this general flow:

```text
Cart
 ↓
Checkout Page
 ↓
Shipping Information
 ↓
Payment Method
 ↓
Create Order API
 ↓
Backend validates:
    - authentication
    - shipping information
    - payment method
    - cart contents
    - product stock
 ↓
Order created
 ↓
Product stock reduced
 ↓
Cart cleared
```

The order stores a snapshot of important product information, including:

- Product ID
- Product name
- Product image
- Quantity
- Price

This prevents the order history from depending entirely on the current product price/name.

---

## 9. Order Data

An order contains information such as:

```text
user
orderItems
shippingAddress
paymentMethod
paymentStatus
isPaid
orderStatus
itemsPrice
shippingPrice
taxPrice
totalPrice
paymentResult
paidAt
deliveredAt
createdAt
updatedAt
```

### Payment Status

The current order model supports:

```text
Pending
Paid
Failed
Refunded
```

### Order Status

The current order model supports:

```text
Pending
Processing
Shipped
Delivered
Cancelled
```

---

## 10. Price Calculation

The backend calculates the order total instead of trusting the total sent by the frontend.

The calculation is:

```text
Items Price
+ Shipping Price
+ Tax
= Total Price
```

The current backend logic uses:

```text
Free shipping when itemsPrice >= 5000 ETB
Otherwise shipping = 200 ETB
Tax = 15% of itemsPrice
```

Therefore:

```text
shippingPrice = 0     when itemsPrice >= 5000
shippingPrice = 200   when itemsPrice < 5000

taxPrice = itemsPrice × 0.15

totalPrice = itemsPrice + shippingPrice + taxPrice
```

---

## 11. Stock Management

Before creating an order, the backend checks whether every product exists and has enough stock.

After a successful order:

```text
Available Stock
      ↓
Subtract Ordered Quantity
      ↓
Save Product
```

When an eligible order is cancelled, the backend restores the ordered quantities to product stock.

This stock operation is handled by the order controller.

---

## 12. Payment Architecture

The project contains a payment controller for Chapa.

### Chapa Payment Flow

```text
Checkout
   ↓
Create Order
   ↓
Order paymentStatus = Pending
   ↓
Initialize Chapa Payment
   ↓
Chapa Checkout Page
   ↓
Customer Completes Payment
   ↓
Chapa Callback / Verification
   ↓
Verify Transaction
   ↓
If successful:
    paymentStatus = Paid
    isPaid = true
    paidAt = current date
   ↓
Order Updated
```

The backend stores payment-related information such as:

```text
transactionId
txRef
status
method
amount
currency
```

### Important Payment Security Rule

Secret payment credentials must remain on the backend.

Never put:

```text
CHAPA_SECRET_KEY
JWT secrets
MongoDB passwords
private API credentials
```

inside frontend source code or commit them to GitHub.

---

## 13. API Examples

### Authentication

```http
POST /api/auth/login
POST /api/auth/register
```

### Products

```http
GET /api/products
GET /api/products/:id
```

### Orders

```http
POST /api/orders
GET /api/orders/my-orders
GET /api/orders/:id
PUT /api/orders/:id/cancel
PUT /api/orders/:id/status
```

### Payments

```http
POST /api/payments/chapa/initialize
GET /api/payments/chapa/verify/:txRef
GET /api/payments/chapa/callback
```

> Exact endpoints should be verified against the current route files before presenting this list as the final API specification.

---

## 14. Environment Variables

The backend should use an environment file for private configuration.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

CHAPA_SECRET_KEY=your_chapa_secret_key
```

The exact variable names must match the project's current backend configuration.

### Never Commit `.env`

Add the following to `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
build/
```

Create a safe example file instead:

```text
.env.example
```

with placeholder values only.

---

## 15. Installation

### Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd OICT-TechStore
```

### Backend

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Add the required environment variables.

Start the backend:

```bash
npm run dev
```

or, depending on the project's package scripts:

```bash
npm start
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs through the Vite development server.

---

## 16. API Testing with Postman

Postman can be used to test the backend independently from the React frontend.

Recommended testing sequence:

```text
1. Register user
2. Login
3. Copy authentication token
4. Add product to cart
5. Get cart
6. Create order
7. Get my orders
8. Get order by ID
9. Initialize payment
10. Verify payment
11. Test cancellation
```

For protected requests, configure the authentication token according to the project's authentication middleware.

---

## 17. Error Handling

The backend returns HTTP status codes according to the result of the request.

Examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
500 Internal Server Error
```

Examples of validation handled by the order controller:

- Missing shipping address
- Missing customer name
- Missing phone number
- Missing city
- Invalid payment method
- Empty cart
- Missing product
- Insufficient stock
- Unauthorized order access

---

## 18. Security Considerations

The application should follow these practices:

- Keep secrets in environment variables.
- Do not commit `.env`.
- Protect private API endpoints with authentication middleware.
- Validate request data on the backend.
- Verify that users can access only their own orders.
- Validate product stock before creating an order.
- Do not trust frontend-calculated totals.
- Keep payment secret keys on the server.
- Validate payment results through the payment provider before marking an order as paid.

---

## 19. Development Workflow

Recommended Git workflow:

```text
Create / modify feature
        ↓
Run frontend
        ↓
Run backend
        ↓
Test API with Postman
        ↓
Test feature in browser
        ↓
Check console/server errors
        ↓
git status
        ↓
git add
        ↓
git commit
        ↓
git push
```

Use meaningful commits such as:

```text
feat: implement cart context
feat: add checkout and order flow
feat: integrate Chapa payment
fix: correct cart count
fix: validate order payment method
docs: update project README
```

---

## 20. Project Presentation – Backend Responsibilities

For a backend presentation, the important areas to understand are:

### 1. Architecture

Be able to explain:

```text
Frontend
   ↓
Axios / HTTP
   ↓
Express Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Mongoose Models
   ↓
MongoDB
```

### 2. Authentication

Explain:

- How users log in
- How authentication is maintained
- How protected routes work
- How `req.user` is obtained
- Why users cannot access another user's orders

### 3. Cart

Explain:

- How a cart belongs to a user
- How products are added
- How quantities change
- How cart totals/counts are calculated

### 4. Orders

Explain:

- How an order is created
- How the backend validates the cart
- How stock is checked
- How prices are calculated
- Why the cart is cleared
- How order status changes

### 5. Payments

Explain:

- Why payment starts after order creation
- How a transaction reference is generated
- How Chapa initialization works
- How payment verification works
- Why the backend verifies payment before marking it as paid

### 6. Database

Know the relationships between:

```text
User
 ↓
Cart
 ↓
Product

User
 ↓
Order
 ↓
OrderItem
 ↓
Product
```

---

## 21. Important Files for the Backend Developer

The following files are especially important to understand before the project presentation:

```text
backend/
├── server.js
├── routes/
├── controllers/
├── models/
├── middleware/
└── services/
```

In particular, understand the source code for:

```text
authController.js
authMiddleware.js
productController.js
cartController.js
orderController.js
paymentController.js
User.js
Product.js
Cart.js
Order.js
```

Exact filenames may differ depending on the final repository structure.

---

## 22. Known Development Considerations

Before production deployment, the following areas should be reviewed:

- Add role-based authorization for admin routes.
- Add stronger request validation.
- Use database transactions for critical stock/order operations where appropriate.
- Implement and test each external payment provider separately.
- Add payment webhook verification where required by the provider.
- Add automated backend tests.
- Add frontend error/loading states.
- Configure production CORS and environment variables.
- Configure production database and deployment URLs.
- Review rate limiting and security headers.
- Add logging and monitoring.

---

## 23. Production Deployment Checklist

Before deployment:

```text
[ ] Remove development-only secrets
[ ] Configure production environment variables
[ ] Configure production MongoDB
[ ] Configure frontend API URL
[ ] Configure backend URL
[ ] Configure payment callback/return URLs
[ ] Test authentication
[ ] Test cart
[ ] Test checkout
[ ] Test orders
[ ] Test payment verification
[ ] Test cancellation
[ ] Test stock handling
[ ] Test admin authorization
[ ] Build frontend
[ ] Test production build
```

---

## 24. Team Contribution

### Backend

Responsible for:

- API development
- Authentication
- Database models
- Cart APIs
- Order APIs
- Payment integration
- Stock management
- Backend validation
- API testing

### Frontend

Responsible for:

- User interface
- Product pages
- Cart interface
- Checkout interface
- Order pages
- Responsive design
- API integration

### Admin

Responsible for:

- Product management
- Order management
- Payment monitoring
- Banner/content management
- Administrative workflows

Update this section with the actual names and responsibilities of your team members before final submission.

---

## 25. License

This project was developed as an academic/team project for OICT TechStore.

Add the appropriate license here if the project is intended for public redistribution.

---

## 26. Authors

**OICT TechStore Development Team**

Replace this section with the actual team members, roles, GitHub profiles, and institution information before submitting the project.

---

## 27. Repository

GitHub repository:

```text
<YOUR_GITHUB_REPOSITORY_URL>
```

Replace the placeholder with the actual repository URL.
