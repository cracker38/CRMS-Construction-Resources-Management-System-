import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Materials from './pages/Materials'
import Inventory from './pages/Inventory'
import PurchaseRequests from './pages/PurchaseRequests'
import PurchaseRequestDetail from './pages/PurchaseRequestDetail'
import Equipment from './pages/Equipment'
import Employees from './pages/Employees'
import Timesheets from './pages/Timesheets'
import Expenses from './pages/Expenses'
import Suppliers from './pages/Suppliers'
import Layout from './components/Layout'
import BackendError from './components/BackendError'

function PrivateRoute({ children }) {
  const { user, token } = useSelector((state) => state.auth)
  return token && user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <>
      <BackendError />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="purchase-requests" element={<PurchaseRequests />} />
        <Route path="purchase-requests/:id" element={<PurchaseRequestDetail />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="employees" element={<Employees />} />
        <Route path="timesheets" element={<Timesheets />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="suppliers" element={<Suppliers />} />
      </Route>
    </Routes>
    </>
  )
}

export default App




