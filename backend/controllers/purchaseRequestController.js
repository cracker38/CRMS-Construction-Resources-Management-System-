const { PurchaseRequest, PurchaseRequestItem, Material, Supplier, Project, User, Notification } = require('../models');
const { Op } = require('sequelize');

// Generate PR number
const generatePRNumber = async () => {
  const count = await PurchaseRequest.count();
  return `PR-${String(count + 1).padStart(6, '0')}`;
};

// Get all purchase requests
exports.getAllPurchaseRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, projectId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Project, as: 'project' },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        purchaseRequests: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single purchase request
exports.getPurchaseRequest = async (req, res) => {
  try {
    const pr = await PurchaseRequest.findByPk(req.params.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Project, as: 'project' },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
      ]
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    res.json({
      success: true,
      data: { purchaseRequest: pr }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create purchase request
exports.createPurchaseRequest = async (req, res) => {
  try {
    const { projectId, supplierId, items, remarks } = req.body;

    const prNumber = await generatePRNumber();
    let totalAmount = 0;

    items.forEach(item => {
      totalAmount += parseFloat(item.quantity) * parseFloat(item.unitPrice);
    });

    const pr = await PurchaseRequest.create({
      prNumber,
      projectId,
      supplierId,
      requestedById: req.user.id,
      totalAmount,
      remarks,
      status: 'pending'
    });

    // Create items
    const prItems = await Promise.all(
      items.map(item =>
        PurchaseRequestItem.create({
          purchaseRequestId: pr.id,
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice)
        })
      )
    );

    // Notify approvers (Project Managers and Admins)
    const approvers = await User.findAll({
      include: [{ model: require('../models').Role, as: 'role' }],
      where: {
        '$role.name$': { [Op.in]: ['Admin', 'Project Manager'] }
      }
    });

    for (const approver of approvers) {
      await Notification.create({
        userId: approver.id,
        type: 'approval_pending',
        title: 'Purchase Request Pending Approval',
        message: `Purchase request ${prNumber} requires your approval`,
        relatedId: pr.id,
        relatedType: 'purchase_request'
      });
    }

    const createdPR = await PurchaseRequest.findByPk(pr.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Project, as: 'project' },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Purchase request created successfully',
      data: { purchaseRequest: createdPR }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Approve purchase request
exports.approvePurchaseRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const pr = await PurchaseRequest.findByPk(id);
    if (!pr) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (pr.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Purchase request is not pending approval'
      });
    }

    pr.status = action === 'approve' ? 'approved' : 'rejected';
    pr.approvedById = req.user.id;
    pr.approvedAt = new Date();
    await pr.save();

    // Notify requester
    await Notification.create({
      userId: pr.requestedById,
      type: 'general',
      title: `Purchase Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Your purchase request ${pr.prNumber} has been ${action === 'approve' ? 'approved' : 'rejected'}`,
      relatedId: pr.id,
      relatedType: 'purchase_request'
    });

    const updatedPR = await PurchaseRequest.findByPk(pr.id, {
      include: [
        { model: Supplier, as: 'supplier' },
        { model: Project, as: 'project' },
        { model: User, as: 'requestedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'firstName', 'lastName'] },
        { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
      ]
    });

    res.json({
      success: true,
      message: `Purchase request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: { purchaseRequest: updatedPR }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




