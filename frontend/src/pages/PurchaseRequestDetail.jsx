import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import { useSelector } from 'react-redux'

export default function PurchaseRequestDetail() {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequest()
  }, [id])

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/purchase-requests/${id}`)
      setRequest(response.data.data.purchaseRequest)
    } catch (error) {
      console.error('Failed to fetch purchase request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (action) => {
    try {
      await api.post(`/purchase-requests/${id}/approve`, { action })
      fetchRequest()
    } catch (error) {
      console.error('Failed to approve/reject:', error)
      alert(error.response?.data?.message || 'Failed to process request')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading purchase request...</div>
  }

  if (!request) {
    return <div className="text-center py-8">Purchase request not found</div>
  }

  const canApprove = ['Admin', 'Project Manager'].includes(user?.role?.name) && request.status === 'pending'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Purchase Request: {request.prNumber}</h1>
        {canApprove && (
          <div className="space-x-2">
            <button
              onClick={() => handleApprove('approve')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleApprove('reject')}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Request Details</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Project</dt>
            <dd className="text-sm text-gray-900">{request.project?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Supplier</dt>
            <dd className="text-sm text-gray-900">{request.supplier?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="text-sm text-gray-900">{request.status}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
            <dd className="text-sm text-gray-900">${parseFloat(request.totalAmount).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Requested By</dt>
            <dd className="text-sm text-gray-900">
              {request.requestedBy?.firstName} {request.requestedBy?.lastName}
            </dd>
          </div>
          {request.approvedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Approved By</dt>
              <dd className="text-sm text-gray-900">
                {request.approvedBy?.firstName} {request.approvedBy?.lastName}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Items</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {request.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.material?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(item.unitPrice).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(item.totalPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}




