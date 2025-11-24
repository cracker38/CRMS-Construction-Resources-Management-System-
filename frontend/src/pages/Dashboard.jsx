import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import Toast from '../components/Toast'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPOModal, setShowPOModal] = useState(false)
  const [selectedPR, setSelectedPR] = useState(null)
  const [poFormData, setPoFormData] = useState({ expectedDeliveryDate: '' })
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' })

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard')
      setDashboardData(response.data.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const handleCreatePO = (pr) => {
    setSelectedPR(pr)
    setPoFormData({ expectedDeliveryDate: '' })
    setShowPOModal(true)
  }

  const handlePOSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/purchase-orders', {
        purchaseRequestId: selectedPR.id,
        expectedDeliveryDate: poFormData.expectedDeliveryDate
      })
      showToast('Purchase Order created successfully', 'success')
      setShowPOModal(false)
      fetchDashboardData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create PO', 'error')
    }
  }

  const handleReceivePO = async (poId) => {
    if (!window.confirm('Mark this Purchase Order as received and update inventory?')) return
    try {
      await api.post(`/purchase-orders/${poId}/receive`)
      showToast('Purchase Order received and inventory updated', 'success')
      fetchDashboardData()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load dashboard data</div>
        <button onClick={fetchDashboardData} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  const userRole = user?.role?.name || 'Employee'

  // PROJECT MANAGER DASHBOARD
  if (userRole === 'Project Manager') {
    return <ProjectManagerDashboard dashboardData={dashboardData} user={user} />
  }

  // SITE SUPERVISOR DASHBOARD
  if (userRole === 'Site Supervisor') {
    return <SiteSupervisorDashboard dashboardData={dashboardData} user={user} />
  }

  // PROCUREMENT OFFICER DASHBOARD
  if (userRole === 'Procurement Officer') {
    return (
      <ProcurementOfficerDashboard
        dashboardData={dashboardData}
        user={user}
        onCreatePO={handleCreatePO}
        onReceivePO={handleReceivePO}
        showPOModal={showPOModal}
        setShowPOModal={setShowPOModal}
        selectedPR={selectedPR}
        poFormData={poFormData}
        setPoFormData={setPoFormData}
        onPOSubmit={handlePOSubmit}
        toast={toast}
        setToast={setToast}
      />
    )
  }

  // DEFAULT DASHBOARD (Admin, Employee, etc.)
  return <DefaultDashboard dashboardData={dashboardData} user={user} />
}

// Project Manager Dashboard Component
function ProjectManagerDashboard({ dashboardData, user }) {
  const { kpis, budgetUsage, projectProgress, recentExpenses, budgetOverruns, resourceUtilization } = dashboardData

  const budgetData = budgetUsage?.map((item) => ({
    name: item.projectName.length > 15 ? item.projectName.substring(0, 15) + '...' : item.projectName,
    spent: parseFloat(item.spent || 0),
    remaining: parseFloat(item.remaining || 0),
  })) || []

  const progressData = projectProgress?.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    progress: p.progress
  })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Project Manager Dashboard</h1>
          <p className="text-gray-600">Welcome back, <span className="font-semibold">{user?.firstName}!</span></p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/projects?status=active" className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-sm text-gray-600 mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-blue-600">{kpis.activeProjects}</div>
        </Link>
        <Link to="/purchase-requests?status=pending" className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-sm text-gray-600 mb-1">Pending Approvals</div>
          <div className="text-3xl font-bold text-orange-600">{kpis.pendingApprovals || 0}</div>
        </Link>
        <Link to="/inventory" className="card hover:scale-105 transition-transform cursor-pointer">
          <div className="text-sm text-gray-600 mb-1">Low Stock Items</div>
          <div className="text-3xl font-bold text-red-600">{kpis.lowStockItems || 0}</div>
        </Link>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Budget Overruns</div>
          <div className="text-3xl font-bold text-red-600">{kpis.budgetOverruns || 0}</div>
        </div>
      </div>

      {/* Budget Usage Chart */}
      {budgetData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Budget Usage Summary</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="spent" fill="#EF4444" name="Spent" />
              <Bar dataKey="remaining" fill="#10B981" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project Progress Chart */}
      {progressData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Project Progress</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="progress" fill="#3B82F6" name="Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resource Utilization Analytics */}
      {resourceUtilization && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Resource Utilization Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Equipment Utilization</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Equipment</span>
                  <span className="font-semibold">{resourceUtilization.equipment.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Use</span>
                  <span className="font-semibold text-blue-600">{resourceUtilization.equipment.inUse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-semibold text-green-600">{resourceUtilization.equipment.available}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Utilization Rate</span>
                    <span className="font-semibold">{resourceUtilization.equipment.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${resourceUtilization.equipment.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Employee Utilization</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Assigned</span>
                  <span className="font-semibold">{resourceUtilization.employees.total}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Utilization Rate</span>
                    <span className="font-semibold">{resourceUtilization.employees.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${resourceUtilization.employees.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Overruns Alert */}
      {budgetOverruns && budgetOverruns.length > 0 && (
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Budget Overrun Alerts</h2>
          <div className="space-y-2">
            {budgetOverruns.map((overrun, idx) => (
              <div key={idx} className="bg-white rounded p-3">
                <div className="font-semibold text-red-800">{overrun.projectName}</div>
                <div className="text-sm text-gray-600">
                  Overrun: ${parseFloat(overrun.overrun).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      {recentExpenses && recentExpenses.length > 0 && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Recent Expenses</h2>
            <Link to="/expenses" className="text-sm text-blue-600 hover:text-blue-800">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.project?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="badge badge-info">{expense.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${parseFloat(expense.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Site Supervisor Dashboard Component
function SiteSupervisorDashboard({ dashboardData, user }) {
  const { kpis, dailyActivity, materialStock, lowStockAlerts, equipmentLogs, recentTimesheets } = dashboardData

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Site Supervisor Dashboard</h1>
          <p className="text-gray-600">Welcome back, <span className="font-semibold">{user?.firstName}!</span></p>
        </div>
        <Link to="/purchase-requests" className="btn-primary mt-4 md:mt-0">
          Submit Purchase Request
        </Link>
      </div>

      {/* Daily Activity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Today's Workers</div>
          <div className="text-3xl font-bold text-blue-600">{kpis.todayWorkers || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Today's Hours</div>
          <div className="text-3xl font-bold text-green-600">{(kpis.todayHours || 0).toFixed(1)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Low Stock Alerts</div>
          <div className="text-3xl font-bold text-red-600">{kpis.lowStockAlerts || 0}</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts && lowStockAlerts.length > 0 && (
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-800 mb-4">⚠️ Low Stock Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockAlerts.map((alert, idx) => (
              <div key={idx} className="bg-white rounded p-3">
                <div className="font-semibold text-red-800">{alert.materialName}</div>
                <div className="text-sm text-gray-600">
                  Project: {alert.projectName} | Current: {alert.currentStock} {alert.unit} (Min: {alert.minStock} {alert.unit})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Stock Levels */}
      {materialStock && materialStock.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Material Stock Levels</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialStock.map((stock, idx) => (
                  <tr key={idx} className={stock.isLowStock ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{stock.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{stock.materialName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{stock.quantity} {stock.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock.isLowStock ? (
                        <span className="badge badge-danger">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment Usage Logs */}
      {equipmentLogs && equipmentLogs.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Equipment Usage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Equipment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentLogs.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{eq.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{eq.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{eq.projectName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${eq.status === 'in_use' ? 'bg-blue-500' : eq.status === 'maintenance' ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                        {eq.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worker Attendance & Timesheets */}
      {recentTimesheets && recentTimesheets.length > 0 && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Recent Timesheets</h2>
            <Link to="/timesheets" className="text-sm text-blue-600 hover:text-blue-800">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(ts.workDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ts.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{ts.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{ts.hoursWorked} hrs</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${ts.status === 'approved' ? 'bg-green-500' : ts.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
                        {ts.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Procurement Officer Dashboard Component
function ProcurementOfficerDashboard({ dashboardData, user, onCreatePO, onReceivePO, showPOModal, setShowPOModal, selectedPR, poFormData, setPoFormData, onPOSubmit, toast, setToast }) {
  const { kpis, approvedPurchaseRequests, purchaseOrders, pendingDeliveriesList } = dashboardData

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Procurement Officer Dashboard</h1>
          <p className="text-gray-600">Welcome back, <span className="font-semibold">{user?.firstName}!</span></p>
        </div>
        <Link to="/suppliers" className="btn-primary mt-4 md:mt-0">
          Manage Suppliers
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Approved PRs</div>
          <div className="text-3xl font-bold text-blue-600">{kpis.approvedPRs || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Pending Deliveries</div>
          <div className="text-3xl font-bold text-orange-600">{kpis.pendingDeliveries || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Procurement</div>
          <div className="text-2xl font-bold text-green-600">${(kpis.totalProcurementExpenses || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Active Suppliers</div>
          <div className="text-3xl font-bold text-purple-600">{kpis.activeSuppliers || 0}</div>
        </div>
      </div>

      {/* Approved Purchase Requests */}
      {approvedPurchaseRequests && approvedPurchaseRequests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Approved Purchase Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Convert to Purchase Orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PR Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvedPurchaseRequests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{pr.prNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{pr.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{pr.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${parseFloat(pr.totalAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onCreatePO(pr)}
                        className="btn-primary text-sm"
                      >
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchase Orders */}
      {purchaseOrders && purchaseOrders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Purchase Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PR Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{po.poNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{po.prNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{po.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{po.supplierName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${parseFloat(po.totalAmount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${po.status === 'received' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {po.status === 'issued' && (
                        <button
                          onClick={() => onReceivePO(po.id)}
                          className="btn-success text-sm"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Deliveries */}
      {pendingDeliveriesList && pendingDeliveriesList.length > 0 && (
        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">⏳ Pending Deliveries</h2>
          <div className="space-y-2">
            {pendingDeliveriesList.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded p-3">
                <div className="font-semibold text-yellow-800">{delivery.poNumber}</div>
                <div className="text-sm text-gray-600">
                  Project: {delivery.projectName} | Supplier: {delivery.supplierName}
                </div>
                <div className="text-sm text-gray-600">
                  Expected: {new Date(delivery.expectedDeliveryDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      <Modal
        isOpen={showPOModal}
        onClose={() => setShowPOModal(false)}
        title="Create Purchase Order"
        size="md"
      >
        {selectedPR && (
          <form onSubmit={onPOSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">PR Number</div>
              <div className="font-semibold">{selectedPR.prNumber}</div>
              <div className="text-sm text-gray-600 mt-2 mb-1">Project</div>
              <div className="font-semibold">{selectedPR.projectName}</div>
              <div className="text-sm text-gray-600 mt-2 mb-1">Supplier</div>
              <div className="font-semibold">{selectedPR.supplierName}</div>
              <div className="text-sm text-gray-600 mt-2 mb-1">Total Amount</div>
              <div className="font-semibold text-lg">${parseFloat(selectedPR.totalAmount).toLocaleString()}</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery Date *</label>
              <input
                type="date"
                value={poFormData.expectedDeliveryDate}
                onChange={(e) => setPoFormData({ ...poFormData, expectedDeliveryDate: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowPOModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Purchase Order
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

// Default Dashboard Component (Admin, Employee, etc.)
function DefaultDashboard({ dashboardData, user }) {
  const { kpis, budgetUsage, recentExpenses } = dashboardData

  const budgetData = budgetUsage?.map((item) => ({
    name: item.projectName.length > 15 ? item.projectName.substring(0, 15) + '...' : item.projectName,
    spent: parseFloat(item.spent || 0),
    remaining: parseFloat(item.remaining || 0),
  })) || []

  const categoryData = recentExpenses?.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount)
    return acc
  }, {}) || {}

  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value: parseFloat(value) }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, <span className="font-semibold">{user?.firstName}!</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Active Projects</div>
          <div className="text-3xl font-bold text-blue-600">{kpis.activeProjects || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Projects</div>
          <div className="text-3xl font-bold text-green-600">{kpis.totalProjects || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Notifications</div>
          <div className="text-3xl font-bold text-indigo-600">{kpis.unreadNotifications || 0}</div>
        </div>
      </div>

      {budgetData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Budget Usage by Project</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="spent" fill="#EF4444" name="Spent" />
              <Bar dataKey="remaining" fill="#10B981" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {recentExpenses && recentExpenses.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800">Recent Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{expense.project?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="badge badge-info">{expense.category}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">${parseFloat(expense.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
