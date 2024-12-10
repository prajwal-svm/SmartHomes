import { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import SignIn from './components/Signin';
import SignUp from './components/Signup';
import Dashboard from './components/Dashboard';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import OrdersView from './components/Orders';
import Catalog from './components/Catalog';
import Customers from './components/Customers';

import { Toaster } from "@/components/ui/toaster"
import Trending from './components/Trending';
import { ShoppingBag, Package, Truck } from 'lucide-react';
import Inventory from './components/Inventory';
import SalesReport from './components/SalesReport';
import ReplacementStatus from './components/ReplacementStatus';
import RecommendationsPage from './components/Recommendations';

function App() {
  const [auth, setAuth] = useState(sessionStorage.getItem('auth') || false);
  const [products, setProducts] = useState([])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:8080/SmartHomes/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Fetch products error:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!auth) {
      return <Navigate to="/signin" replace />;
    }
    return children;
  };

  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex justify-center space-x-8">
          <div className="flex flex-col items-center">
            <Package className="w-8 h-8 text-blue-500 animate-bounce" />
            <span className="mt-2 text-sm text-gray-500">Products</span>
          </div>
          <div className="flex flex-col items-center">
            <Truck className="w-8 h-8 text-green-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="mt-2 text-sm text-gray-500">Delivery</span>
          </div>
          <div className="flex flex-col items-center">
            <ShoppingBag className="w-8 h-8 text-yellow-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="mt-2 text-sm text-gray-500">Deals</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn setAuth={setAuth} />} />
        <Route path="/signup" element={<SignUp setAuth={setAuth} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard products={products} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart products={products} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout products={products} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersView products={products} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <Catalog products={products} refetchProducts={fetchProducts} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-report"
          element={
            <ProtectedRoute>
              <SalesReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trending"
          element={
            <ProtectedRoute>
              <Trending />
            </ProtectedRoute>
          }
        />
         <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/replacement-status/:ticketNumber"
          element={<ReplacementStatus />}
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;