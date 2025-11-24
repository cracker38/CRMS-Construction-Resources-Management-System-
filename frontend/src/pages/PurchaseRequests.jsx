import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

export default function PurchaseRequests() {
  const { user } = useSelector((state) => state.auth)
  const [requests, setRequests] = useState([])
  const [projects, setProjects] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' })
  const [formData, setFormData] = useState({
    projectId: '',
    supplierId: '',
    remarks: '',
    items: [{ materialId: '', quantity: '', unitPrice: '' }]
  })

  useEffect(() => {
    fetchRequests()
    fetchProjects()
    fetchSuppliers()
    fetchMaterials()
  }, [page, statusFilter, search])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await api.get(`/purchase-requests?${params}`)
      setRequests(response.data.data.purchaseRequests)
      setTotalPages(response.data.data.pagination.totalPages)
    } catch (error) {
      showToast('Failed to fetch purchase requests', 'error')
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

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers?limit=100')
      setSuppliers(response.data.data.suppliers || [])
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
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

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const handleCreate = () => {
    setFormData({
      projectId: '',
      supplierId: '',
      remarks: '',
      items: [{ materialId: '', quantity: '', unitPrice: '' }]
    })
    setShowModal(true)
  }

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: '', unitPrice: '' }]
    })
  }

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      })
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    
    // Auto-fill unit price from material if available
    if (field === 'materialId' && value) {
      const material = materials.find(m => m.id === parseInt(value))
      if (material) {
        newItems[index].unitPrice = material.unitCost
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        projectId: parseInt(formData.projectId),
        supplierId: parseInt(formData.supplierId),
        remarks: formData.remarks,
        items: formData.items.map(item => ({
          materialId: parseInt(item.materialId),
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        }))
      }

      await api.post('/purchase-requests', data)
      showToast('Purchase request created successfully', 'success')
      setShowModal(false)
      fetchRequests()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const handleApprove = async (id, action) => {
    try {
      await api.post(`/purchase-requests/${id}/approve`, { action })
      showToast(`Purchase request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success')
      fetchRequests()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      cancelled: 'bg-gray-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const canApprove = ['Admin', 'Project Manager'].includes(user?.role?.name)
  const totalAmount = formData.items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0))
  }, 0)

  if (loading && requests.length === 0) {
    return <LoadingSpinner text="Loading purchase requests..." />
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
          <h1 className="text-3xl font-bold gradient-text mb-2">Purchase Requests</h1>
          <p className="text-gray-600">Manage material purchase requests</p>
        </div>
        <button onClick={handleCreate} className="btn-primary mt-4 md:mt-0">
          <span className="mr-2">+</span> New Purchase Request
        </button>
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
                placeholder="Search by PR number..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Requests Table */}
      <div className="table-container">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No purchase requests found</p>
            <button onClick={handleCreate} className="btn-primary">
              Create First Purchase Request
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Requested By</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/purchase-requests/${request.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                        >
                          {request.prNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.supplier?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${parseFloat(request.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(request.status)} text-white`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {request.requestedBy?.firstName} {request.requestedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/purchase-requests/${request.id}`}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            View
                          </Link>
                          {canApprove && request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(request.id, 'approve')}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(request.id, 'reject')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                Reject
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

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Purchase Request"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Items *</label>
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
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
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      min="0"
                      placeholder="Qty"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      required
                      min="0"
                      placeholder="Unit Price"
                      className="input-field"
                    />
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-semibold text-gray-700">
                      ${(parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-secondary text-sm w-full"
              >
                + Add Item
              </button>
            </div>
            <div className="mt-2 text-right">
              <span className="text-lg font-bold text-gray-800">
                Total: ${totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows="3"
              className="input-field"
              placeholder="Additional notes or remarks..."
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
              Create Purchase Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
