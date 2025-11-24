const { Employee, Assignment, Project } = require('../models');
const { Op } = require('sequelize');

exports.getAllEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, isActive } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
        { position: { [Op.like]: `%${search}%` } }
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit,
      offset,
      order: [['employeeId', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        employees: rows,
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

exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [{ model: Project, as: 'project' }]
        }
      ]
    });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    res.json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    await employee.update(req.body);
    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    await employee.destroy();
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { projectId, startDate, endDate } = req.body;

    const assignment = await Assignment.create({
      employeeId,
      projectId,
      startDate,
      endDate,
      isActive: true
    });

    const assignmentWithDetails = await Assignment.findByPk(assignment.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: { assignment: assignmentWithDetails }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


