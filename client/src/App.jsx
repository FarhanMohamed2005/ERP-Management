import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import SalesOrders from './pages/SalesOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import GoodsReceipt from './pages/GoodsReceipt';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import LowStockAlerts from './pages/LowStockAlerts';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';
import CustomerDetail from './pages/CustomerDetail';
import SupplierDetail from './pages/SupplierDetail';
import CreditNotes from './pages/CreditNotes';
import Quotations from './pages/Quotations';
import Expenses from './pages/Expenses';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />}
      />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/grn" element={<GoodsReceipt />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/credit-notes" element={<CreditNotes />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/low-stock" element={<LowStockAlerts />} />
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route element={<MainLayout />}>
          <Route path="/users" element={<Users />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
