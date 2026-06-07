import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';
import Inventory from './pages/Inventory';
import Inspection from './pages/Inspection';
import MemberCenter from './pages/MemberCenter';
import AdminDashboard from './pages/AdminDashboard';
import PriceForecast from './pages/PriceForecast';
import Reports from './pages/Reports';
import PurchaseRequests from './pages/PurchaseRequests';
import CreditCenter from './pages/CreditCenter';

function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="create-order" element={<CreateOrder />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inspection" element={<Inspection />} />
        <Route path="member" element={<MemberCenter />} />
        <Route path="credit" element={<CreditCenter />} />
        <Route path="price-forecast" element={<PriceForecast />} />
        {user?.role === 'admin' && (
          <>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="reports" element={<Reports />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default App;
