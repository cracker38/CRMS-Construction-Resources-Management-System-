const { Project, Inventory, Material, Equipment, PurchaseRequest, PurchaseRequestItem, PurchaseOrder, Expense, Timesheet, Notification, Employee, Assignment, Supplier } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.name;

    // Get projects based on role
    let projectWhere = {};
    let assignedProjectIds = [];

    if (userRole === 'Project Manager') {
      projectWhere.projectManagerId = userId;
    }

    // Common data for all roles
    const activeProjects = await Project.count({
      where: { ...projectWhere, status: 'active' }
    });

    const totalProjects = await Project.count({ where: projectWhere });

    // Unread notifications
    const unreadNotifications = await Notification.count({
      where: { userId, isRead: false }
    });

    // Role-specific data
    let dashboardData = {
      role: userRole,
      kpis: {
        activeProjects,
        totalProjects,
        unreadNotifications
      }
    };

    // PROJECT MANAGER DASHBOARD
    if (userRole === 'Project Manager') {
      // Budget usage summary
      const projects = await Project.findAll({ where: projectWhere });
      const projectBudgets = await Promise.all(
        projects.map(async (project) => {
          const totalExpenses = await Expense.sum('amount', {
            where: { projectId: project.id }
          }) || 0;
          return {
            projectId: project.id,
            projectName: project.name,
            budget: parseFloat(project.budget),
            spent: totalExpenses,
            remaining: parseFloat(project.budget) - totalExpenses,
            percentage: (totalExpenses / parseFloat(project.budget)) * 100
          };
        })
      );

      // Pending approvals
      const pendingApprovals = await PurchaseRequest.count({
        where: { status: 'pending' }
      });

      // Project progress data
      const projectProgress = projects.map(p => ({
        name: p.name,
        progress: p.progress,
        status: p.status
      }));

      // Resource utilization (equipment in use for PM's projects)
      const equipmentInUse = await Equipment.count({
        where: {
          projectId: { [Op.in]: projects.map(p => p.id) },
          status: 'in_use'
        }
      });

      // Resource utilization analytics
      const totalEquipment = await Equipment.count({
        where: { projectId: { [Op.in]: projects.map(p => p.id) } }
      });
      
      const totalEmployees = await Assignment.count({
        where: {
          projectId: { [Op.in]: projects.map(p => p.id) },
          isActive: true
        }
      });

      const resourceUtilization = {
        equipment: {
          total: totalEquipment,
          inUse: equipmentInUse,
          available: totalEquipment - equipmentInUse,
          utilizationRate: totalEquipment > 0 ? (equipmentInUse / totalEquipment) * 100 : 0
        },
        employees: {
          total: totalEmployees,
          utilizationRate: totalEmployees > 0 ? 100 : 0 // Assuming all assigned employees are utilized
        }
      };

      // Low stock alerts for PM's projects
      const inventories = await Inventory.findAll({
        where: { projectId: { [Op.in]: projects.map(p => p.id) } },
        include: [{ model: Material, as: 'material' }]
      });
      const lowStockItems = inventories.filter(inv => {
        return parseFloat(inv.quantity) < parseFloat(inv.material.minStock);
      }).length;

      // Recent expenses
      const recentExpenses = await Expense.findAll({
        where: { projectId: { [Op.in]: projects.map(p => p.id) } },
        include: [{ model: Project, as: 'project' }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      // Budget overrun alerts
      const budgetOverruns = projectBudgets.filter(pb => pb.percentage > 100);

      dashboardData = {
        ...dashboardData,
        kpis: {
          ...dashboardData.kpis,
          pendingApprovals,
          lowStockItems,
          equipmentInUse,
          budgetOverruns: budgetOverruns.length
        },
        budgetUsage: projectBudgets,
        projectProgress,
        recentExpenses,
        resourceUtilization,
        budgetOverruns: budgetOverruns.map(bo => ({
          projectName: bo.projectName,
          budget: bo.budget,
          spent: bo.spent,
          overrun: bo.spent - bo.budget
        }))
      };
    }

    // SITE SUPERVISOR DASHBOARD
    else if (userRole === 'Site Supervisor') {
      // Find employee record for this user (Site Supervisors might be employees)
      const employee = await Employee.findOne({
        where: { email: req.user.email }
      });

      if (employee) {
        // Get projects assigned to this supervisor via assignments
        const assignments = await Assignment.findAll({
          where: { employeeId: employee.id, isActive: true },
          include: [{ model: Project, as: 'project' }]
        });
        assignedProjectIds = assignments.map(a => a.projectId);
      }
      
      // If no assignments, show all active projects (Site Supervisor can see all)
      if (assignedProjectIds.length === 0) {
        const allProjects = await Project.findAll({ where: { status: 'active' } });
        assignedProjectIds = allProjects.map(p => p.id);
      }
      
      projectWhere.id = { [Op.in]: assignedProjectIds.length > 0 ? assignedProjectIds : [0] };
      const projects = await Project.findAll({ where: projectWhere });
      
      // Daily site activity (today's timesheets)
      const today = new Date().toISOString().split('T')[0];
      const todayTimesheets = await Timesheet.findAll({
        where: {
          projectId: { [Op.in]: assignedProjectIds.length > 0 ? assignedProjectIds : [0] },
          workDate: today
        },
        include: [
          { model: Employee, as: 'employee' },
          { model: Project, as: 'project' }
        ]
      });

      // Material stock levels for assigned projects
      const inventories = await Inventory.findAll({
        where: { projectId: { [Op.in]: assignedProjectIds.length > 0 ? assignedProjectIds : [0] } },
        include: [{ model: Material, as: 'material' }, { model: Project, as: 'project' }]
      });

      // Low stock alerts
      const lowStockAlerts = inventories.filter(inv => {
        return parseFloat(inv.quantity) < parseFloat(inv.material.minStock);
      }).map(inv => ({
        projectName: inv.project.name,
        materialName: inv.material.name,
        currentStock: inv.quantity,
        minStock: inv.material.minStock,
        unit: inv.material.unit
      }));

      // Equipment usage logs for assigned projects
      const equipmentLogs = await Equipment.findAll({
        where: {
          projectId: { [Op.in]: assignedProjectIds.length > 0 ? assignedProjectIds : [0] }
        },
        include: [{ model: Project, as: 'project' }],
        order: [['updatedAt', 'DESC']],
        limit: 10
      });

      // Worker attendance & timesheets (recent)
      const recentTimesheets = await Timesheet.findAll({
        where: { projectId: { [Op.in]: assignedProjectIds.length > 0 ? assignedProjectIds : [0] } },
        include: [
          { model: Employee, as: 'employee' },
          { model: Project, as: 'project' }
        ],
        order: [['workDate', 'DESC']],
        limit: 10
      });

      dashboardData = {
        ...dashboardData,
        kpis: {
          ...dashboardData.kpis,
          todayWorkers: todayTimesheets.length,
          todayHours: todayTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked || 0), 0),
          lowStockAlerts: lowStockAlerts.length,
          equipmentInUse: equipmentLogs.filter(e => e.status === 'in_use').length
        },
        dailyActivity: {
          todayTimesheets,
          totalHours: todayTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hoursWorked || 0), 0)
        },
        materialStock: inventories.map(inv => ({
          projectName: inv.project.name,
          materialName: inv.material.name,
          quantity: inv.quantity,
          unit: inv.material.unit,
          minStock: inv.material.minStock,
          isLowStock: parseFloat(inv.quantity) < parseFloat(inv.material.minStock)
        })),
        lowStockAlerts,
        equipmentLogs: equipmentLogs.map(eq => ({
          id: eq.id,
          name: eq.name,
          type: eq.type,
          status: eq.status,
          projectName: eq.project?.name
        })),
        recentTimesheets: recentTimesheets.map(ts => ({
          id: ts.id,
          workDate: ts.workDate,
          employeeName: `${ts.employee.firstName} ${ts.employee.lastName}`,
          projectName: ts.project.name,
          hoursWorked: ts.hoursWorked,
          status: ts.status
        }))
      };
    }

    // PROCUREMENT OFFICER DASHBOARD
    else if (userRole === 'Procurement Officer') {
      // Approved Purchase Requests
      const approvedPRs = await PurchaseRequest.findAll({
        where: { status: 'approved' },
        include: [
          { model: Project, as: 'project' },
          { model: Supplier, as: 'supplier' },
          { model: PurchaseRequestItem, as: 'items', include: [{ model: Material, as: 'material' }] }
        ],
        order: [['approvedAt', 'DESC']]
      });

      // Purchase Orders
      const purchaseOrders = await PurchaseOrder.findAll({
        include: [
          {
            model: PurchaseRequest,
            as: 'purchaseRequest',
            include: [
              { model: Project, as: 'project' },
              { model: Supplier, as: 'supplier' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Pending deliveries (issued POs not yet received)
      const pendingDeliveries = await PurchaseOrder.count({
        where: { status: 'issued' }
      });

      // Procurement expenses (from approved PRs)
      const procurementExpenses = approvedPRs.reduce((sum, pr) => sum + parseFloat(pr.totalAmount || 0), 0);

      // Suppliers count
      const suppliersCount = await Supplier.count({
        where: { isActive: true }
      });

      dashboardData = {
        ...dashboardData,
        kpis: {
          ...dashboardData.kpis,
          approvedPRs: approvedPRs.length,
          pendingDeliveries,
          totalProcurementExpenses: procurementExpenses,
          activeSuppliers: suppliersCount
        },
        approvedPurchaseRequests: approvedPRs.map(pr => ({
          id: pr.id,
          prNumber: pr.prNumber,
          projectName: pr.project.name,
          supplierName: pr.supplier.name,
          totalAmount: pr.totalAmount,
          approvedAt: pr.approvedAt,
          items: pr.items.map(item => ({
            materialName: item.material.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        })),
        purchaseOrders: purchaseOrders.map(po => ({
          id: po.id,
          poNumber: po.poNumber,
          prNumber: po.purchaseRequest.prNumber,
          projectName: po.purchaseRequest.project.name,
          supplierName: po.purchaseRequest.supplier.name,
          totalAmount: po.totalAmount,
          status: po.status,
          expectedDeliveryDate: po.expectedDeliveryDate,
          receivedDate: po.receivedDate
        })),
        pendingDeliveriesList: purchaseOrders.filter(po => po.status === 'issued').map(po => ({
          id: po.id,
          poNumber: po.poNumber,
          projectName: po.purchaseRequest.project.name,
          supplierName: po.purchaseRequest.supplier.name,
          expectedDeliveryDate: po.expectedDeliveryDate
        }))
      };
    }

    // ADMIN or OTHER ROLES - Default dashboard
    else {
      const projects = await Project.findAll({ where: projectWhere });
      const projectBudgets = await Promise.all(
        projects.map(async (project) => {
          const totalExpenses = await Expense.sum('amount', {
            where: { projectId: project.id }
          }) || 0;
          return {
            projectId: project.id,
            projectName: project.name,
            budget: parseFloat(project.budget),
            spent: totalExpenses,
            remaining: parseFloat(project.budget) - totalExpenses,
            percentage: (totalExpenses / parseFloat(project.budget)) * 100
          };
        })
      );

      const recentExpenses = await Expense.findAll({
        include: [{ model: Project, as: 'project' }],
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      dashboardData = {
        ...dashboardData,
        budgetUsage: projectBudgets,
        recentExpenses
      };
    }

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




