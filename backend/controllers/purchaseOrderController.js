const { PurchaseOrder, PurchaseRequest, PurchaseRequestItem, Material, Inventory } = require('../models');

// Generate PO number
const generatePONumber = async () => {
  const count = await PurchaseOrder.count();
  return `PO-${String(count + 1).padStart(6, '0')}`;
};

// Create purchase order from approved PR
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { purchaseRequestId, expectedDeliveryDate } = req.body;

    const pr = await PurchaseRequest.findByPk(purchaseRequestId, {
      include: [{ model: PurchaseRequestItem, as: 'items' }]
    });

    if (!pr) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    if (pr.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Purchase request must be approved before creating PO'
      });
    }

    // Check if PO already exists
    const existingPO = await PurchaseOrder.findOne({
      where: { purchaseRequestId }
    });

    if (existingPO) {
      return res.status(400).json({
        success: false,
        message: 'Purchase order already exists for this PR'
      });
    }

    const poNumber = await generatePONumber();

    const po = await PurchaseOrder.create({
      poNumber,
      purchaseRequestId,
      totalAmount: pr.totalAmount,
      expectedDeliveryDate,
      status: 'issued'
    });

    const createdPO = await PurchaseOrder.findByPk(po.id, {
      include: [
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          include: [
            { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchaseOrder: createdPO }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Receive purchase order (update inventory)
exports.receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const po = await PurchaseOrder.findByPk(id, {
      include: [
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          include: [
            { model: PurchaseRequestItem, as: 'items' }
          ]
        }
      ]
    });

    if (!po) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (po.status !== 'issued') {
      return res.status(400).json({
        success: false,
        message: 'Purchase order is not in issued status'
      });
    }

    // Update inventory for each item
    for (const item of po.purchaseRequest.items) {
      let inventory = await Inventory.findOne({
        where: {
          projectId: po.purchaseRequest.projectId,
          materialId: item.materialId
        }
      });

      if (!inventory) {
        inventory = await Inventory.create({
          projectId: po.purchaseRequest.projectId,
          materialId: item.materialId,
          quantity: 0
        });
      }

      inventory.quantity = parseFloat(inventory.quantity) + parseFloat(item.quantity);
      await inventory.save();
    }

    po.status = 'received';
    po.receivedDate = new Date();
    await po.save();

    const updatedPO = await PurchaseOrder.findByPk(po.id, {
      include: [
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          include: [
            { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Purchase order received and inventory updated',
      data: { purchaseOrder: updatedPO }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all purchase orders
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: PurchaseRequest,
          as: 'purchaseRequest',
          include: [
            { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
          ]
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        purchaseOrders: rows,
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




