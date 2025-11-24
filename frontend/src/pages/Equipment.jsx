import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

export default function Equipment() {
  const { user } = useSelector((state) => state.auth)
  const [equipment, setEquipment] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' })
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serialNumber: '',
    status: 'available',
    projectId: '',
    purchaseDate: '',
    purchaseCost: '',
    description: ''
  })
  const [deployProjectId, setDeployProjectId] = useState('')

  useEffect(() => {
    fetchEquipment()
    fetchProjects()
  }, [page, statusFilter, search])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await api.get(`/equipment?${params}`)
      setEquipment(response.data.data.equipment)
      setTotalPages(response.data.data.pagination.totalPages)
    } catch (error) {
      showToast('Failed to fetch equipment', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects?limit=100')
      setProjects(response.data.data.projects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const handleCreate = () => {
    setEditingEquipment(null)
    setFormData({
      name: '',
      type: '',
      serialNumber: '',
      status: 'available',
      projectId: '',
      purchaseDate: '',
      purchaseCost: '',
      description: ''
    })
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setEditingEquipment(item)
    setFormData({
      name: item.name,
      type: item.type,
      serialNumber: item.serialNumber || '',
      status: item.status,
      projectId: item.projectId || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
      purchaseCost: item.purchaseCost || '',
      description: item.description || ''
    })
    setShowModal(true)
  }

  const handleDeploy = (item) => {
    setSelectedEquipment(item)
    setDeployProjectId('')
    setShowDeployModal(true)
  }

  const handleDeploySubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/equipment/${selectedEquipment.id}/deploy`, { projectId: parseInt(deployProjectId) })
      showToast('Equipment deployed successfully', 'success')
      setShowDeployModal(false)
      fetchEquipment()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to deploy equipment', 'error')
    }
  }

  const handleReturn = async (id) => {
    if (!window.confirm('Return this equipment to inventory?')) return

    try {
      await api.post(`/equipment/${id}/return`)
      showToast('Equipment returned successfully', 'success')
      fetchEquipment()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to return equipment', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) return

    try {
      await api.delete(`/equipment/${id}`)
      showToast('Equipment deleted successfully', 'success')
      fetchEquipment()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete equipment', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null
      }

      if (editingEquipment) {
        await api.put(`/equipment/${editingEquipment.id}`, data)
        showToast('Equipment updated successfully', 'success')
      } else {
        await api.post('/equipment', data)
        showToast('Equipment created successfully', 'success')
      }
      setShowModal(false)
      fetchEquipment()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500',
      in_use: 'bg-blue-500',
      maintenance: 'bg-yellow-500',
      retired: 'bg-gray-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const canEdit = ['Admin', 'Site Supervisor'].includes(user?.role?.name)

  if (loading && equipment.length === 0) {
    return <LoadingSpinner text="Loading equipment..." />
  }

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
          <h1 className="text-3xl font-bold gradient-text mb-2">Equipment</h1>
          <p className="text-gray-600">Manage construction equipment and assets</p>
        </div>
        {canEdit && (
          <button onClick={handleCreate} className="btn-primary mt-4 md:mt-0">
            <span className="mr-2">+</span> Add Equipment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name, type, or serial number..."
                className="input-field pl-10"
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="table-container">
        {equipment.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No equipment found</p>
            {canEdit && (
              <button onClick={handleCreate} className="btn-primary">
                Add First Equipment
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">{item.description.substring(0, 40)}...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.serialNumber || <span className="text-gray-400">N/A</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(item.status)} text-white`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.project ? (
                          <span className="font-medium">{item.project.name}</span>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                Edit
                              </button>
                              {item.status === 'available' && (
                                <button
                                  onClick={() => handleDeploy(item)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  Deploy
                                </button>
                              )}
                              {item.status === 'in_use' && (
                                <button
                                  onClick={() => handleReturn(item.id)}
                                  className="text-orange-600 hover:text-orange-800 transition-colors"
                                >
                                  Return
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="input-field"
              placeholder="e.g., Excavator, Crane, Bulldozer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="input-field"
                placeholder="e.g., Heavy Machinery"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="input-field"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="input-field"
              >
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Purchase Cost ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                min="0"
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="input-field"
              placeholder="Enter equipment description..."
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
            <button type="submit" className="btn-primary">
              {editingEquipment ? 'Update Equipment' : 'Create Equipment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deploy Modal */}
      <Modal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        title="Deploy Equipment"
        size="sm"
      >
        <form onSubmit={handleDeploySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Project *</label>
            <select
              value={deployProjectId}
              onChange={(e) => setDeployProjectId(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowDeployModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Deploy Equipment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
