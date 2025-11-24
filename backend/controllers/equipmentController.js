const { Equipment, Project } = require('../models');
const { Op } = require('sequelize');

exports.getAllEquipment = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, projectId, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { type: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Equipment.findAndCountAll({
      where,
      include: [{ model: Project, as: 'project', attributes: ['id', 'name', 'code'] }],
      limit,
      offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        equipment: rows,
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

exports.getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    res.json({
      success: true,
      data: { equipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    const equipmentWithProject = await Equipment.findByPk(equipment.id, {
      include: [{ model: Project, as: 'project' }]
    });
    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: { equipment: equipmentWithProject }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deployEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.body;

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    if (equipment.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Equipment is not available for deployment'
      });
    }

    equipment.projectId = projectId;
    equipment.status = 'in_use';
    await equipment.save();

    const updatedEquipment = await Equipment.findByPk(equipment.id, {
      include: [{ model: Project, as: 'project' }]
    });

    res.json({
      success: true,
      message: 'Equipment deployed successfully',
      data: { equipment: updatedEquipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.returnEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    equipment.projectId = null;
    equipment.status = 'available';
    await equipment.save();

    const updatedEquipment = await Equipment.findByPk(equipment.id, {
      include: [{ model: Project, as: 'project' }]
    });

    res.json({
      success: true,
      message: 'Equipment returned successfully',
      data: { equipment: updatedEquipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    await equipment.update(req.body);
    const updatedEquipment = await Equipment.findByPk(equipment.id, {
      include: [{ model: Project, as: 'project' }]
    });
    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: { equipment: updatedEquipment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    await equipment.destroy();
    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


