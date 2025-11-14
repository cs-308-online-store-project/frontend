// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import Cart from "./pages/Cart";


function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* Login sayfasında navbar görünmesin */}
      {location.pathname !== "/login" && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/cart" element={<Cart />} />

      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

