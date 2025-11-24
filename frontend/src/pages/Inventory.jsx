import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

export default function Inventory() {
  const { user } = useSelector((state) => state.auth)
  const [inventory, setInventory] = useState([])
  const [projects, setProjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [adjustType, setAdjustType] = useState('add')
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' })
  const [formData, setFormData] = useState({
    projectId: '',
    materialId: '',
    quantity: ''
  })

  useEffect(() => {
    fetchProjects()
    fetchMaterials()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchInventory()
    } else {
      fetchAllInventory()
    }
  }, [selectedProject, lowStockFilter])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects?limit=100')
      setProjects(response.data.data.projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials?limit=100')
      setMaterials(response.data.data.materials)
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    }
  }

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/inventory/projects/${selectedProject}`)
      let inventoryData = response.data.data.inventory
      
      if (lowStockFilter) {
        inventoryData = inventoryData.filter(item => {
          return parseFloat(item.quantity) < parseFloat(item.material.minStock)
        })
      }
      
      setInventory(inventoryData)
    } catch (error) {
      showToast('Failed to fetch inventory', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllInventory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (lowStockFilter) params.append('lowStock', 'true')
      
      const response = await api.get(`/inventory?${params}`)
      setInventory(response.data.data.inventory)
    } catch (error) {
      showToast('Failed to fetch inventory', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const handleAdjust = (item = null) => {
    if (item) {
      setFormData({
        projectId: item.projectId.toString(),
        materialId: item.materialId.toString(),
        quantity: ''
      })
    } else {
      setFormData({
        projectId: selectedProject || '',
        materialId: '',
        quantity: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/inventory/adjust', {
        projectId: parseInt(formData.projectId),
        materialId: parseInt(formData.materialId),
        quantity: parseFloat(formData.quantity),
        type: adjustType
      })
      showToast(`Inventory ${adjustType === 'add' ? 'added' : 'removed'} successfully`, 'success')
      setShowModal(false)
      if (selectedProject) {
        fetchInventory()
      } else {
        fetchAllInventory()
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  if (loading && inventory.length === 0) {
    return <LoadingSpinner text="Loading inventory..." />
  }

  const lowStockAlerts = inventory.filter(item => {
    return parseFloat(item.quantity) < parseFloat(item.material.minStock)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Inventory</h1>
          <p className="text-gray-600">Manage project inventory and track stock levels</p>
        </div>
        <button onClick={() => handleAdjust()} className="btn-primary mt-4 md:mt-0">
          <span className="mr-2">+</span> Adjust Inventory
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Project</label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value)
              }}
              className="input-field"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">Show Low Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && !lowStockFilter && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h2 className="text-lg font-semibold text-red-800">Low Stock Alerts ({lowStockAlerts.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockAlerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 rounded p-2">
                <span className="font-semibold">{alert.material.name}</span> - Current: {alert.quantity} {alert.material.unit} (Min: {alert.material.minStock} {alert.material.unit})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="table-container">
        {inventory.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No inventory items found</p>
            <button onClick={() => handleAdjust()} className="btn-primary">
              Add Inventory Item
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Min Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const isLowStock = parseFloat(item.quantity) < parseFloat(item.material.minStock)
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{item.project?.name}</div>
                        <div className="text-xs text-gray-500">{item.project?.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.material.name}</div>
                        {item.material.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.material.description.substring(0, 40)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.material.category ? (
                          <span className="badge badge-info">{item.material.category}</span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.material.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.material.minStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="badge badge-danger">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleAdjust(item)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Inventory Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Adjust Inventory"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              required
              className="input-field"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Material *</label>
            <select
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              required
              className="input-field"
            >
              <option value="">Select Material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Adjustment Type *</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                adjustType === 'add' ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="add"
                  checked={adjustType === 'add'}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="mr-2"
                />
                <span className="font-semibold text-green-700">Add Stock</span>
              </label>
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                adjustType === 'remove' ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  value="remove"
                  checked={adjustType === 'remove'}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="mr-2"
                />
                <span className="font-semibold text-red-700">Remove Stock</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
            <input
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              min="0"
              className="input-field"
              placeholder="Enter quantity"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className={`btn-primary ${adjustType === 'remove' ? 'btn-danger' : ''}`}>
              {adjustType === 'add' ? 'Add to Inventory' : 'Remove from Inventory'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
