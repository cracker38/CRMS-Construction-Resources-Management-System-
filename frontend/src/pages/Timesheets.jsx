import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../utils/api'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast from '../components/Toast'

export default function Timesheets() {
  const { user } = useSelector((state) => state.auth)
  const [timesheets, setTimesheets] = useState([])
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [projectFilter, setProjectFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTimesheet, setEditingTimesheet] = useState(null)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' })
  const [formData, setFormData] = useState({
    projectId: '',
    employeeId: '',
    workDate: '',
    hoursWorked: '',
    taskDescription: ''
  })

  useEffect(() => {
    fetchTimesheets()
    fetchProjects()
    fetchEmployees()
  }, [page, projectFilter, employeeFilter, statusFilter])

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      if (projectFilter) params.append('projectId', projectFilter)
      if (employeeFilter) params.append('employeeId', employeeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await api.get(`/timesheets?${params}`)
      setTimesheets(response.data.data.timesheets)
      setTotalPages(response.data.data.pagination.totalPages)
    } catch (error) {
      showToast('Failed to fetch timesheets', 'error')
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

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees?limit=100')
      setEmployees(response.data.data.employees.filter(e => e.isActive))
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type })
  }

  const handleCreate = () => {
    setEditingTimesheet(null)
    setFormData({
      projectId: '',
      employeeId: '',
      workDate: new Date().toISOString().split('T')[0],
      hoursWorked: '',
      taskDescription: ''
    })
    setShowModal(true)
  }

  const handleEdit = (timesheet) => {
    setEditingTimesheet(timesheet)
    setFormData({
      projectId: timesheet.projectId.toString(),
      employeeId: timesheet.employeeId.toString(),
      workDate: timesheet.workDate.split('T')[0],
      hoursWorked: timesheet.hoursWorked,
      taskDescription: timesheet.taskDescription || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timesheet?')) return

    try {
      await api.delete(`/timesheets/${id}`)
      showToast('Timesheet deleted successfully', 'success')
      fetchTimesheets()
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete timesheet', 'error')
    }
  }

  const handleApprove = async (id, action) => {
    try {
      await api.post(`/timesheets/${id}/approve`, { action })
      showToast(`Timesheet ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success')
      fetchTimesheets()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        projectId: parseInt(formData.projectId),
        employeeId: parseInt(formData.employeeId),
        workDate: formData.workDate,
        hoursWorked: parseFloat(formData.hoursWorked),
        taskDescription: formData.taskDescription
      }

      if (editingTimesheet) {
        await api.put(`/timesheets/${editingTimesheet.id}`, data)
        showToast('Timesheet updated successfully', 'success')
      } else {
        await api.post('/timesheets', data)
        showToast('Timesheet submitted successfully', 'success')
      }
      setShowModal(false)
      fetchTimesheets()
    } catch (error) {
      showToast(error.response?.data?.message || 'Operation failed', 'error')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  const canApprove = ['Admin', 'Project Manager', 'Site Supervisor'].includes(user?.role?.name)
  const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked || 0), 0)

  if (loading && timesheets.length === 0) {
    return <LoadingSpinner text="Loading timesheets..." />
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
          <h1 className="text-3xl font-bold gradient-text mb-2">Timesheets</h1>
          <p className="text-gray-600">Track employee work hours and time entries</p>
        </div>
        <button onClick={handleCreate} className="btn-primary mt-4 md:mt-0">
          <span className="mr-2">+</span> Submit Timesheet
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Entries</div>
          <div className="text-3xl font-bold text-blue-600">{timesheets.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Hours</div>
          <div className="text-3xl font-bold text-green-600">{totalHours.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
          <div className="text-3xl font-bold text-yellow-600">
            {timesheets.filter(t => t.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Filter</label>
            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value)
                setPage(1)
              }}
              className="input-field"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Filter</label>
            <select
              value={employeeFilter}
              onChange={(e) => {
                setEmployeeFilter(e.target.value)
                setPage(1)
              }}
              className="input-field"
            >
              <option value="">All Employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
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
            </select>
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="table-container">
        {timesheets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No timesheets found</p>
            <button onClick={handleCreate} className="btn-primary">
              Submit First Timesheet
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(timesheet.workDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {timesheet.employee?.firstName} {timesheet.employee?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{timesheet.employee?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timesheet.project?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {parseFloat(timesheet.hoursWorked).toFixed(2)} hrs
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {timesheet.taskDescription ? (
                          <div className="max-w-xs truncate" title={timesheet.taskDescription}>
                            {timesheet.taskDescription}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${getStatusColor(timesheet.status)} text-white`}>
                          {timesheet.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(timesheet)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            Edit
                          </button>
                          {canApprove && timesheet.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(timesheet.id, 'approve')}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApprove(timesheet.id, 'reject')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(timesheet.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
                          </button>
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
        title={editingTimesheet ? 'Edit Timesheet' : 'Submit Timesheet'}
        size="md"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Employee *</label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Date *</label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Worked *</label>
              <input
                type="number"
                step="0.25"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                required
                min="0"
                max="24"
                className="input-field"
                placeholder="8.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Description</label>
            <textarea
              value={formData.taskDescription}
              onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
              rows="3"
              className="input-field"
              placeholder="Describe the work performed..."
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
              {editingTimesheet ? 'Update Timesheet' : 'Submit Timesheet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
