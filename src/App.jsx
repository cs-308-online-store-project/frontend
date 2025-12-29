// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
<<<<<<< Updated upstream
import { ToastProvider } from "./context/ToastContext";
=======
import ChatButton from "./chat/ChatButton";
import { ToastProvider } from "./context/ToastContext";  
>>>>>>> Stashed changes

// CUSTOMER PAGES
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import OrderHistory from "./pages/OrderHistory";
import OrderDetail from "./pages/OrderDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductManager from "./pages/ProductManager";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";

// ADMIN
import AdminLayout from "./layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminChat from "./pages/admin/AdminChat";

// ✅ SALES MANAGER REPORTS
import SalesReports from "./pages/admin/SalesReports";
import SalesPricing from "./pages/admin/SalesPricing";
import PrivateRoute from "./components/PrivateRoute";
import Notifications from "./pages/Notifications";


function AppContent() {
  const location = useLocation();

  return (
    <>
      {/* Show navbar only outside admin/login/register */}
      {location.pathname !== "/login" &&
        location.pathname !== "/register" &&
        !location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/product-manager") && <Navbar />}

      <Routes>
        <Route path="/" element={<Navigate to="/products" />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* CUSTOMER */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />

        {/* PRODUCT MANAGER */}
        <Route path="/product-manager" element={<ProductManager />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
<<<<<<< Updated upstream

          {/* ✅ SALES MANAGER */}
          <Route
            path="reports"
            element={
              <PrivateRoute role="sales_manager">
                <SalesReports />
              </PrivateRoute>
            }
          />
          <Route
            path="sales-pricing"
            element={
              <PrivateRoute role="sales_manager">
                <SalesPricing />
              </PrivateRoute>
            }
          />

        </Route>

        <Route path="/notifications" element={<Notifications />} />


        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
=======
          <Route path="chat" element={<AdminChat />} />
        </Route>

        <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>

      {/* Chat Button - Show everywhere except login/register */}
      {location.pathname !== "/login" && 
       location.pathname !== "/register" && 
       !location.pathname.startsWith("/admin") &&
       <ChatButton />}
>>>>>>> Stashed changes
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}