const { Timesheet, Employee, Project } = require('../models');
const { Op } = require('sequelize');

exports.submitTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.create(req.body);
    const timesheetWithDetails = await Timesheet.findByPk(timesheet.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Timesheet submitted successfully',
      data: { timesheet: timesheetWithDetails }
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Timesheet already exists for this date'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getProjectTimesheets = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, employeeId } = req.query;

    const where = { projectId: id };
    if (startDate && endDate) {
      where.workDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (employeeId) where.employeeId = employeeId;

    const timesheets = await Timesheet.findAll({
      where,
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ],
      order: [['workDate', 'DESC']]
    });

    // Calculate totals
    const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked), 0);

    res.json({
      success: true,
      data: {
        timesheets,
        summary: {
          totalHours,
          totalEntries: timesheets.length
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

exports.getAllTimesheets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { projectId, employeeId, status, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.workDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows } = await Timesheet.findAndCountAll({
      where,
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ],
      limit,
      offset,
      order: [['workDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        timesheets: rows,
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

exports.updateTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findByPk(req.params.id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }
    await timesheet.update(req.body);
    const updatedTimesheet = await Timesheet.findByPk(timesheet.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ]
    });
    res.json({
      success: true,
      message: 'Timesheet updated successfully',
      data: { timesheet: updatedTimesheet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteTimesheet = async (req, res) => {
  try {
    const timesheet = await Timesheet.findByPk(req.params.id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }
    await timesheet.destroy();
    res.json({
      success: true,
      message: 'Timesheet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const timesheet = await Timesheet.findByPk(id);
    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: 'Timesheet not found'
      });
    }

    timesheet.status = action === 'approve' ? 'approved' : 'rejected';
    await timesheet.save();

    const updatedTimesheet = await Timesheet.findByPk(timesheet.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: Project, as: 'project' }
      ]
    });

    res.json({
      success: true,
      message: `Timesheet ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: { timesheet: updatedTimesheet }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


