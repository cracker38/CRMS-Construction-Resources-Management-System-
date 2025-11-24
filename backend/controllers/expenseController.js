const { Expense, Project, User } = require('../models');
const { Op } = require('sequelize');

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      recordedById: req.user.id
    });

    // Check for budget overrun
    const project = await Project.findByPk(req.body.projectId);
    const totalExpenses = await Expense.sum('amount', {
      where: { projectId: req.body.projectId }
    });

    if (totalExpenses > project.budget) {
      await require('../models').Notification.create({
        userId: project.projectManagerId,
        type: 'budget_overrun',
        title: 'Budget Overrun Alert',
        message: `Project ${project.name} has exceeded its budget`,
        relatedId: project.id,
        relatedType: 'project'
      });
    }

    const expenseWithDetails = await Expense.findByPk(expense.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: { expense: expenseWithDetails }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { projectId, category, startDate, endDate, search } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (startDate && endDate) {
      where.expenseDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName'] }
      ],
      limit,
      offset,
      order: [['expenseDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        expenses: rows,
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

exports.getProjectExpenses = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, category } = req.query;

    const where = { projectId: id };
    if (startDate && endDate) {
      where.expenseDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (category) where.category = category;

    const expenses = await Expense.findAll({
      where,
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['expenseDate', 'DESC']]
    });

    // Calculate summary
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    const project = await Project.findByPk(id);
    const budgetUsage = {
      total: totalAmount,
      budget: parseFloat(project.budget),
      percentage: (totalAmount / parseFloat(project.budget)) * 100
    };

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          totalAmount,
          categoryBreakdown,
          budgetUsage
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

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    await expense.update(req.body);
    const updatedExpense = await Expense.findByPk(expense.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'recordedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    await expense.destroy();
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


