import { useEffect, useState } from "react";
import { useNavigate }        from "react-router-dom";

import { getCart }                                from "../services/cartService";
import { createOrder }                            from "../services/orderService";
import { initializeChapaPayment, getPaymentSettings } from "../services/paymentService";
import { applyCoupon, checkFirstOrderDiscount }   from "../services/couponService";
import { useCart }                                from "../context/CartContext";
import { useAuth }                                from "../context/AuthContext";

import "../styles/checkout.css";

const BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "https://e-commerce-techstore-y26d.onrender.com/api";

const MANUAL_METHODS = ["CBE Birr", "Telebirr", "M-Pesa", "Awash Bank"];

const paymentMethods = [
  { value: "Chapa",            name: "Chapa",            description: "Pay securely through Chapa" },
  { value: "CBE Birr",         name: "CBE Birr",         description: "Scan QR & upload screenshot" },
  { value: "Telebirr",         name: "Telebirr",         description: "Scan QR & upload screenshot" },
  { value: "M-Pesa",           name: "M-Pesa",           description: "Scan QR & upload screenshot" },
  { value: "Awash Bank",       name: "Awash Bank",       description: "Scan QR & upload screenshot" },
  { value: "Cash On Delivery", name: "Cash on Delivery", description: "Pay when your order arrives"  },
];

const Checkout = () => {
  const navigate          = useNavigate();
  const { loadCartCount } = useCart();
  const { user }          = useAuth();

  const [cart,          setCart]          = useState({ items: [] });
  const [subtotal,      setSubtotal]      = useState(0);   // itemsPrice + shipping (pre-tax pre-discount)
  const [itemsPrice,    setItemsPrice]    = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");
  const [loading,       setLoading]       = useState(false);
  const [qrSettings,    setQrSettings]    = useState(null);

  // Coupon state
  const [couponInput,   setCouponInput]   = useState("");
  const [couponApplied, setCouponApplied] = useState(null);  // { code, type, discount, discountAmount, description }
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // First-order discount
  const [firstOrderEligible,  setFirstOrderEligible]  = useState(false);
  const [useFirstOrder,       setUseFirstOrder]        = useState(false);
  const [firstOrderDiscount,  setFirstOrderDiscount]   = useState(0);

  const [shipping, setShipping] = useState({
    fullName: "", phone: "", email: "", address: "", city: "", country: "Ethiopia",
  });

  // ── Load cart ──────────────────────────────────────────────────
  useEffect(() => {
    getCart()
      .then((d) => {
        const c = d.cart || { items: [] };
        const ip = (d.totalPrice || 0);
        setCart(c);
        setItemsPrice(ip);
        // subtotal = itemsPrice + shipping (mirror backend logic)
        const ship = ip >= 5000 ? 0 : 200;
        setSubtotal(ip + ship);
      })
      .catch(console.error);
  }, []);

  // ── Load QR settings ──────────────────────────────────────────
  useEffect(() => {
    getPaymentSettings()
      .then((d) => setQrSettings(d.settings))
      .catch(console.error);
  }, []);

  // ── Check first-order eligibility ─────────────────────────────
  useEffect(() => {
    if (!user) return;
    checkFirstOrderDiscount()
      .then((d) => setFirstOrderEligible(d.eligible))
      .catch(() => {});
  }, [user]);

  // ── Recalculate first-order discount when subtotal changes ────
  useEffect(() => {
    setFirstOrderDiscount(useFirstOrder && firstOrderEligible ? Math.round(subtotal * 0.10 * 100) / 100 : 0);
  }, [useFirstOrder, firstOrderEligible, subtotal]);

  // ── Derived totals ─────────────────────────────────────────────
  const tax           = Math.round(itemsPrice * 0.15 * 100) / 100;
  const shippingPrice = itemsPrice >= 5000 ? 0 : 200;
  const discountAmt   = couponApplied ? couponApplied.discountAmount : firstOrderDiscount;
  const finalTotal    = Math.max(0, itemsPrice + shippingPrice + tax - discountAmt);

  const handleShippingChange = (e) =>
    setShipping((p) => ({ ...p, [e.target.name]: e.target.value }));

  // ── Apply coupon ───────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { setCouponError("Enter a coupon code."); return; }
    try {
      setCouponLoading(true);
      setCouponError("");
      const data = await applyCoupon(couponInput.trim(), subtotal);
      setCouponApplied(data);
      setUseFirstOrder(false);  // coupon overrides first-order
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon.");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponInput("");
    setCouponError("");
  };

  // ── Toggle first-order discount ────────────────────────────────
  const toggleFirstOrder = () => {
    if (!useFirstOrder) setCouponApplied(null); // clear coupon if enabling first-order
    setUseFirstOrder((p) => !p);
  };

  // ── Place order ────────────────────────────────────────────────
  const handleOrder = async () => {
    if (!shipping.fullName.trim()) { alert("Please enter your full name."); return; }
    if (!shipping.phone.trim())    { alert("Please enter your phone number."); return; }
    if (!shipping.address.trim())  { alert("Please enter your address."); return; }
    if (!shipping.city.trim())     { alert("Please enter your city."); return; }
    if (!cart.items.length)        { alert("Your cart is empty."); return; }

    try {
      setLoading(true);
      const response = await createOrder({
        shippingAddress: {
          fullName: shipping.fullName,
          phone:    shipping.phone,
          address:  shipping.address,
          city:     shipping.city,
          country:  shipping.country,
        },
        paymentMethod,
        couponCode:           couponApplied?.code || "",
        useFirstOrderDiscount: useFirstOrder && firstOrderEligible && !couponApplied,
      });

      const order = response.order;
      if (!order) throw new Error("Order was not created.");

      // ── Chapa ────────────────────────────────────────────────────
      if (paymentMethod === "Chapa") {
        if (!shipping.email.trim()) { alert("Please enter your email for Chapa payment."); return; }
        const parts     = shipping.fullName.trim().split(" ");
        const firstName = parts[0] || "";
        const lastName  = parts.slice(1).join(" ") || firstName;
        const payment   = await initializeChapaPayment({
          orderId: order._id, firstName, lastName, email: shipping.email, phone: shipping.phone,
        });
        if (!payment.success || !payment.checkoutUrl)
          throw new Error(payment.message || "Unable to start Chapa payment.");
        window.location.href = payment.checkoutUrl;
        return;
      }

      await loadCartCount();
      if (MANUAL_METHODS.includes(paymentMethod)) {
        navigate(`/orders/${order._id}?upload=1`);
      } else {
        navigate("/orders");
      }
    } catch (err) {
      console.error("Order error:", err);
      alert(err.response?.data?.message || err.message || "Unable to place order.");
    } finally {
      setLoading(false);
    }
  };

  const showManualQR = MANUAL_METHODS.includes(paymentMethod);
  const totalItems   = cart.items.reduce((t, i) => t + i.quantity, 0);

  if (!cart.items.length) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add some products before continuing to checkout.</p>
          <button onClick={() => navigate("/products")}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Secure checkout · Fast delivery · Safe payment</p>
      </div>

      <div className="checkout-layout">
        {/* ══ LEFT ══════════════════════════════════════════════════ */}
        <div className="checkout-main">

          {/* 1. Delivery */}
          <section className="checkout-card">
            <div className="section-title">
              <span>1</span>
              <div><h2>Delivery Address</h2><p>Where should we deliver your order?</p></div>
            </div>
            <div className="form-grid">
              {[
                { label: "Full Name",     name: "fullName", type: "text",  placeholder: "Enter your full name" },
                { label: "Phone Number",  name: "phone",    type: "tel",   placeholder: "+251 9..." },
                { label: "Email Address", name: "email",    type: "email", placeholder: "you@example.com" },
              ].map(({ label, name, type, placeholder }) => (
                <div className="form-group" key={name}>
                  <label>{label}</label>
                  <input type={type} name={name} value={shipping[name]} onChange={handleShippingChange} placeholder={placeholder} />
                </div>
              ))}
              <div className="form-group full">
                <label>Street Address</label>
                <input type="text" name="address" value={shipping.address} onChange={handleShippingChange} placeholder="House number, street..." />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={shipping.city} onChange={handleShippingChange} placeholder="Addis Ababa" />
              </div>
              <div className="form-group">
                <label>Country</label>
                <select name="country" value={shipping.country} onChange={handleShippingChange}>
                  <option value="Ethiopia">Ethiopia</option>
                </select>
              </div>
            </div>
          </section>

          {/* 2. Payment method */}
          <section className="checkout-card">
            <div className="section-title">
              <span>2</span>
              <div><h2>Payment Method</h2><p>Choose how you want to pay</p></div>
            </div>
            <div className="payment-methods">
              {paymentMethods.map((m) => (
                <label key={m.value} className={`payment-option${paymentMethod === m.value ? " selected" : ""}`}>
                  <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value}
                    onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div>
                    <strong>{m.name}</strong>
                    <small>{m.description}</small>
                  </div>
                </label>
              ))}
            </div>

            {showManualQR && (
              <div className="manual-payment-info">
                <div className="manual-payment-steps">
                  <h4>📱 How to pay with {paymentMethod}</h4>
                  <ol>
                    <li>Place your order by clicking <strong>Place Order</strong>.</li>
                    <li>Scan the QR code below or transfer to the account shown.</li>
                    <li>Take a screenshot of the successful transfer.</li>
                    <li>Upload the screenshot on the Order Details page.</li>
                    <li>Admin will verify and confirm your order within 1–24 hours.</li>
                  </ol>
                </div>
                {qrSettings?.bankQrCode && (
                  <div className="qr-code-block">
                    <img src={`${BASE}${qrSettings.bankQrCode}`} alt="Bank QR Code" className="qr-code-img" />
                    <p className="qr-scan-hint">Scan to pay</p>
                  </div>
                )}
                {qrSettings?.bankAccounts?.length > 0 && (
                  <div className="bank-accounts-list">
                    <p className="bank-accounts-title">Transfer to one of these accounts:</p>
                    {qrSettings.bankAccounts.map((acc, i) => (
                      <div className="bank-account-item" key={i}>
                        <span className="bank-account-name">{acc.bankName}</span>
                        <div className="bank-account-details">
                          {acc.accountName   && <span>Account: <strong>{acc.accountName}</strong></span>}
                          {acc.accountNumber && (
                            <span className="bank-acct-number">
                              {acc.accountNumber}
                              <button type="button" className="copy-btn"
                                onClick={() => navigator.clipboard.writeText(acc.accountNumber)} title="Copy">
                                📋
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {qrSettings?.instructions && <p className="qr-instructions">{qrSettings.instructions}</p>}
                {!qrSettings?.bankQrCode && !qrSettings?.bankAccounts?.length && (
                  <p className="qr-unavailable">⚠ Bank account details not configured yet. Contact support.</p>
                )}
              </div>
            )}
            <div className="payment-notice">🔒 Your payment information is processed securely.</div>
          </section>

          {/* 3. Order items */}
          <section className="checkout-card">
            <div className="section-title">
              <span>3</span>
              <div><h2>Order Items</h2><p>{cart.items.length} product{cart.items.length !== 1 ? "s" : ""}</p></div>
            </div>
            <div className="checkout-products">
              {cart.items.map((item) => (
                <div className="checkout-product" key={item.product._id}>
                  <img
                    src={item.product.image?.startsWith("http") ? item.product.image : `${BASE}${item.product.image}`}
                    alt={item.product.name}
                    onError={(e) => { e.target.src = "/placeholder.png"; }}
                  />
                  <div className="checkout-product-info">
                    <h3>{item.product.name}</h3>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <strong>ETB {(item.product.price * item.quantity).toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ══ RIGHT — summary ══════════════════════════════════════ */}
        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="summary-row"><span>Products ({totalItems})</span><span>ETB {Number(itemsPrice).toLocaleString()}</span></div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className={shippingPrice === 0 ? "free" : ""}>{shippingPrice === 0 ? "FREE" : `ETB ${shippingPrice.toLocaleString()}`}</span>
          </div>
          <div className="summary-row"><span>Tax (15%)</span><span>ETB {Number(tax).toLocaleString()}</span></div>

          {/* First-order discount banner */}
          {firstOrderEligible && !couponApplied && (
            <div className="co-first-order-banner">
              <div className="co-first-order-top">
                <span>🎉 <strong>10% First Order Discount</strong></span>
                <label className="co-toggle">
                  <input type="checkbox" checked={useFirstOrder} onChange={toggleFirstOrder} />
                  <span className="co-toggle-slider" />
                </label>
              </div>
              {useFirstOrder && (
                <span className="co-first-order-saving">
                  You save ETB {firstOrderDiscount.toLocaleString()}!
                </span>
              )}
            </div>
          )}

          {/* Coupon input */}
          {!couponApplied ? (
            <div className="co-coupon-row">
              <input
                className="co-coupon-input"
                type="text"
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleApplyCoupon(); }}
              />
              <button
                className="co-coupon-btn"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
              >
                {couponLoading ? "…" : "Apply"}
              </button>
            </div>
          ) : (
            <div className="co-coupon-applied">
              <div className="co-coupon-applied-info">
                <span className="co-coupon-tag">🏷 {couponApplied.code}</span>
                {couponApplied.type === "percentage"
                  ? <span>{couponApplied.discount}% off</span>
                  : <span>ETB {couponApplied.discount} off</span>
                }
              </div>
              <button className="co-coupon-remove" onClick={handleRemoveCoupon} aria-label="Remove coupon">✕</button>
            </div>
          )}
          {couponError && <p className="co-coupon-error">{couponError}</p>}

          {/* Discount line */}
          {discountAmt > 0 && (
            <div className="summary-row co-discount-row">
              <span>
                Discount
                {couponApplied ? ` (${couponApplied.code})` : useFirstOrder ? " (First Order)" : ""}
              </span>
              <span className="co-discount-val">− ETB {Number(discountAmt).toLocaleString()}</span>
            </div>
          )}

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total</span>
            <strong>ETB {Number(finalTotal).toLocaleString()}</strong>
          </div>

          <button className="place-order-btn" onClick={handleOrder} disabled={loading}>
            {loading ? "Processing..." : "Place Order"}
          </button>

          {showManualQR && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
              After placing, you will be directed to upload your payment screenshot.
            </p>
          )}
          <div className="secure-checkout">🔒 Secure Checkout</div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
