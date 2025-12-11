
// src/pages/Checkout.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartAPI, orderAPI } from "../services/api";



export default function Checkout() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to continue checkout");
      navigate("/login");
    }
  }, [navigate]);
  
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    paymentMethod: 'cash', // cash or credit
    shippingOption: 'standard', // standard or express
    // Credit card fields
    cardNumber: '',
    cardExpiry: '',
    cardCVV: '',
    cardName: ''
  });
  
  const [errors, setErrors] = useState({});
// Fetch cart
useEffect(() => {
  fetchCart();
}, []);

const fetchCart = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    if (token) {
      // ✅ Login ise backend'den çek
      const response = await cartAPI.getCart();
      setCart(response.data);
      
      // If cart is empty, redirect back
      if (response.data.items.length === 0) {
        alert("Your cart is empty!");
        navigate('/cart');
      }
    } else {
      // ✅ Guest ise localStorage'dan oku
      const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");
      
      if (guestCart.length === 0) {
        alert("Your cart is empty!");
        navigate('/cart');
        return;
      }
      
      const totalPrice = guestCart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      
      setCart({
        items: guestCart,
        total_price: totalPrice
      });
    }
  } catch (err) {
    console.error("Error fetching cart:", err);
    // ✅ Hata olursa da localStorage'dan oku
    const guestCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalPrice = guestCart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    setCart({
      items: guestCart,
      total_price: totalPrice
    });
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    // Credit card validation
    if (formData.paymentMethod === 'credit') {
      if (!formData.cardNumber.trim() || formData.cardNumber.length < 16) {
        newErrors.cardNumber = 'Valid card number is required (16 digits)';
      }
      if (!formData.cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'Valid expiry date required (MM/YY)';
      }
      if (!formData.cardCVV.trim() || formData.cardCVV.length !== 3) {
        newErrors.cardCVV = 'Valid CVV required (3 digits)';
      }
      if (!formData.cardName.trim()) {
        newErrors.cardName = 'Cardholder name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      // Get userId from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      
      if (!userId) {
        alert('Please login first');
        navigate('/login');
        return;
      }

      // Create full address string
      const fullAddress = `${formData.name}, ${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.phone}`;

      // Mock payment processing message
      if (formData.paymentMethod === 'credit') {
        console.log('💳 Mock payment processing:', {
          cardNumber: '****' + formData.cardNumber.slice(-4),
          cardName: formData.cardName,
          amount: total.toFixed(2)
        });
      }

      // Create order
      const response = await orderAPI.createOrder(userId, fullAddress);
      
      if (response.data.success) {
        alert('Order placed successfully! 🎉');
        
        // Clear cart from localStorage
        localStorage.setItem("cart", "[]");
        window.dispatchEvent(new Event("cartUpdated"));
        
        // Redirect to order confirmation
        navigate(`/orders/${response.data.data.id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const subtotal = cart.total_price || 0;
  const tax = subtotal * 0.1; // 10% tax
  const shipping = formData.shippingOption === 'express' ? 10 : 0;
  const total = subtotal + tax + shipping;

  if (loading) {
    return (
      <div style={S.page}>
        <h1 style={S.title}>Checkout</h1>
        <p style={S.loading}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <h1 style={S.title}>Checkout</h1>

      <div style={S.container}>
        {/* LEFT: Form */}
        <div style={S.formSection}>
          <form onSubmit={handleSubmit}>
            {/* Shipping Address */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>Shipping Address</h2>
              
              <div style={S.formGroup}>
                <label style={S.label}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="John Doe"
                />
                {errors.name && <span style={S.error}>{errors.name}</span>}
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="123 Main Street"
                />
                {errors.address && <span style={S.error}>{errors.address}</span>}
              </div>

              <div style={S.row}>
                <div style={S.formGroup}>
                  <label style={S.label}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="Istanbul"
                  />
                  {errors.city && <span style={S.error}>{errors.city}</span>}
                </div>

                <div style={S.formGroup}>
                  <label style={S.label}>Postal Code *</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    style={S.input}
                    placeholder="34000"
                  />
                  {errors.postalCode && <span style={S.error}>{errors.postalCode}</span>}
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={S.input}
                  placeholder="+90 555 123 4567"
                />
                {errors.phone && <span style={S.error}>{errors.phone}</span>}
              </div>
            </div>

            {/* Shipping Options */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>Shipping Options</h2>
              
              <label style={S.radioLabel}>
                <input
                  type="radio"
                  name="shippingOption"
                  value="standard"
                  checked={formData.shippingOption === 'standard'}
                  onChange={handleChange}
                  style={S.radio}
                />
                <span>Standard Shipping (Free) - 5-7 days</span>
              </label>

              <label style={S.radioLabel}>
                <input
                  type="radio"
                  name="shippingOption"
                  value="express"
                  checked={formData.shippingOption === 'express'}
                  onChange={handleChange}
                  style={S.radio}
                />
                <span>Express Shipping ($10) - 1-2 days</span>
              </label>
            </div>

            {/* Payment Method */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>Payment Method</h2>
              
              <label style={S.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={handleChange}
                  style={S.radio}
                />
                <span>Cash on Delivery</span>
              </label>

              <label style={S.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={formData.paymentMethod === 'credit'}
                  onChange={handleChange}
                  style={S.radio}
                />
                <span>Credit Card (Mock)</span>
              </label>

              {/* Mock Credit Card Fields */}
              {formData.paymentMethod === 'credit' && (
                <div style={S.creditCard}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Cardholder Name *</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      style={S.input}
                    />
                    {errors.cardName && <span style={S.error}>{errors.cardName}</span>}
                  </div>

                  <div style={S.formGroup}>
                    <label style={S.label}>Card Number *</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        // Only allow numbers and limit to 16 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setFormData({ ...formData, cardNumber: value });
                        if (errors.cardNumber) {
                          setErrors({ ...errors, cardNumber: '' });
                        }
                      }}
                      placeholder="1234567890123456"
                      style={S.input}
                      maxLength={16}
                    />
                    {errors.cardNumber && <span style={S.error}>{errors.cardNumber}</span>}
                  </div>

                  <div style={S.row}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Expiry Date *</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={(e) => {
                          // Format as MM/YY
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                          }
                          setFormData({ ...formData, cardExpiry: value });
                          if (errors.cardExpiry) {
                            setErrors({ ...errors, cardExpiry: '' });
                          }
                        }}
                        placeholder="MM/YY"
                        style={S.input}
                        maxLength={5}
                      />
                      {errors.cardExpiry && <span style={S.error}>{errors.cardExpiry}</span>}
                    </div>

                    <div style={S.formGroup}>
                      <label style={S.label}>CVV *</label>
                      <input
                        type="text"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={(e) => {
                          // Only numbers, max 3 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setFormData({ ...formData, cardCVV: value });
                          if (errors.cardCVV) {
                            setErrors({ ...errors, cardCVV: '' });
                          }
                        }}
                        placeholder="123"
                        style={S.input}
                        maxLength={3}
                      />
                      {errors.cardCVV && <span style={S.error}>{errors.cardCVV}</span>}
                    </div>
                  </div>

                  <p style={S.mockNote}>
                    💳 Mock payment - no real transaction will be processed
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* RIGHT: Order Summary */}
        <div style={S.summarySection}>
          <div style={S.summary}>
            <h2 style={S.sectionTitle}>Order Summary</h2>

            {/* Items */}
            <div style={S.itemsList}>
              {cart.items.map((item) => (
                <div key={item.id} style={S.summaryItem}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr style={S.divider} />

            {/* Totals */}
            <div style={S.summaryRow}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <div style={S.summaryRow}>
              <span>Tax (10%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            <div style={S.summaryRow}>
              <span>Shipping:</span>
              <span>${shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>

            <hr style={S.divider} />

            <div style={{ ...S.summaryRow, fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...S.placeOrderBtn,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const S = {
  page: { padding: "3rem 2rem", maxWidth: "1400px", margin: "0 auto" },
  title: { fontSize: "2.2rem", marginBottom: "2rem", fontWeight: 700 },
  loading: { textAlign: "center", fontSize: "1.1rem", padding: "3rem 0", color: "#666" },

  container: { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "3rem" },

  formSection: {},
  section: { marginBottom: "2.5rem" },
  sectionTitle: { fontSize: "1.3rem", fontWeight: 600, marginBottom: "1rem" },

  formGroup: { marginBottom: "1.2rem" },
  label: { display: "block", fontSize: "0.9rem", fontWeight: 500, marginBottom: "0.4rem", color: "#333" },
  input: {
    width: "100%",
    padding: "0.8rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
    outline: "none",
    transition: "border 0.2s"
  },
  error: { display: "block", color: "#d11", fontSize: "0.85rem", marginTop: "0.3rem" },

  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },

  radioLabel: {
    display: "block",
    padding: "0.8rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "0.8rem",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  radio: { marginRight: "0.8rem" },

  creditCard: {
    marginTop: "1rem",
    padding: "1rem",
    background: "#f9f9f9",
    borderRadius: "6px"
  },
  mockNote: { fontSize: "0.85rem", color: "#666", marginTop: "0.5rem", fontStyle: "italic" },

  summarySection: { position: "sticky", top: "2rem" },
  summary: {
    padding: "1.5rem",
    border: "1px solid #eee",
    borderRadius: "10px",
    backgroundColor: "#fafafa"
  },

  itemsList: { marginBottom: "1rem" },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.6rem 0",
    fontSize: "0.95rem"
  },

  divider: { border: "none", borderTop: "1px solid #ddd", margin: "1rem 0" },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    fontSize: "1rem"
  },

  placeOrderBtn: {
    width: "100%",
    marginTop: "1.5rem",
    padding: "1rem",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer"
  }
};