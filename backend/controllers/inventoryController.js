const { Inventory, Material, Project, Notification, User } = require('../models');
const { Op } = require('sequelize');

// Get all inventory with filters
exports.getAllInventory = async (req, res) => {
  try {
    const { projectId, materialId, lowStock } = req.query;
    const where = {};
    
    if (projectId) where.projectId = projectId;
    if (materialId) where.materialId = materialId;

    const inventory = await Inventory.findAll({
      where,
      include: [
        { model: Material, as: 'material' },
        { model: Project, as: 'project' }
      ],
      order: [['projectId', 'ASC'], ['materialId', 'ASC']]
    });

    let filteredInventory = inventory;
    if (lowStock === 'true') {
      filteredInventory = inventory.filter(item => {
        return parseFloat(item.quantity) < parseFloat(item.material.minStock);
      });
    }

    res.json({
      success: true,
      data: { inventory: filteredInventory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get inventory for a project
exports.getProjectInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const inventory = await Inventory.findAll({
      where: { projectId: id },
      include: [
        { model: Material, as: 'material' },
        { model: Project, as: 'project' }
      ]
    });

    // Check for low stock alerts
    const lowStockItems = inventory.filter(item => {
      return parseFloat(item.quantity) < parseFloat(item.material.minStock);
    });

    res.json({
      success: true,
      data: {
        inventory,
        lowStockAlerts: lowStockItems.map(item => ({
          materialId: item.materialId,
          materialName: item.material.name,
          currentStock: item.quantity,
          minStock: item.material.minStock
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Adjust inventory
exports.adjustInventory = async (req, res) => {
  try {
    const { projectId, materialId, quantity, type } = req.body;

    let inventory = await Inventory.findOne({
      where: { projectId, materialId }
    });

    if (!inventory) {
      if (type === 'remove') {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove from non-existent inventory'
        });
      }
      inventory = await Inventory.create({
        projectId,
        materialId,
        quantity: 0,
        lastUpdatedBy: req.user.id
      });
    }

    const currentQty = parseFloat(inventory.quantity);
    const adjustQty = parseFloat(quantity);

    if (type === 'add') {
      inventory.quantity = currentQty + adjustQty;
    } else if (type === 'remove') {
      if (currentQty < adjustQty) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      inventory.quantity = currentQty - adjustQty;
    }

    inventory.lastUpdatedBy = req.user.id;
    await inventory.save();

    // Check for low stock and create notification
    const material = await Material.findByPk(materialId);
    if (parseFloat(inventory.quantity) < parseFloat(material.minStock)) {
      const project = await Project.findByPk(projectId);
      await Notification.create({
        userId: project.projectManagerId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${material.name} is below minimum stock level in project ${project.name}`,
        relatedId: inventory.id,
        relatedType: 'inventory'
      });
    }

    const updatedInventory = await Inventory.findByPk(inventory.id, {
      include: [
        { model: Material, as: 'material' },
        { model: Project, as: 'project' }
      ]
    });

    res.json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: { inventory: updatedInventory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


