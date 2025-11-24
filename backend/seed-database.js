const { sequelize, Role, User, Project, Material, Supplier, Employee } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Create Roles
    const roles = await Role.bulkCreate([
      { name: 'Admin', description: 'System Administrator' },
      { name: 'Project Manager', description: 'Manages construction projects' },
      { name: 'Site Supervisor', description: 'Supervises construction sites' },
      { name: 'Procurement Officer', description: 'Handles procurement and purchasing' },
      { name: 'Employee', description: 'Regular employee' }
    ], { ignoreDuplicates: true });
    console.log('Roles created');

    // Create Admin User
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    const pmRole = await Role.findOne({ where: { name: 'Project Manager' } });
    const procRole = await Role.findOne({ where: { name: 'Procurement Officer' } });
    const empRole = await Role.findOne({ where: { name: 'Employee' } });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      username: 'admin',
      email: 'admin@crms.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      roleId: adminRole.id
    });

    const projectManager = await User.create({
      username: 'pm1',
      email: 'pm@crms.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Manager',
      phone: '1234567891',
      roleId: pmRole.id
    });

    const procurementOfficer = await User.create({
      username: 'proc1',
      email: 'proc@crms.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Procurement',
      phone: '1234567892',
      roleId: procRole.id
    });

    console.log('Users created');

    // Create Projects
    const projects = await Project.bulkCreate([
      {
        name: 'Downtown Office Complex',
        code: 'PROJ-001',
        location: '123 Main St, City',
        budget: 5000000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        progress: 45,
        projectManagerId: projectManager.id,
        description: 'Construction of a 10-story office building'
      },
      {
        name: 'Residential Tower A',
        code: 'PROJ-002',
        location: '456 Oak Ave, City',
        budget: 8000000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-06-30'),
        status: 'active',
        progress: 30,
        projectManagerId: projectManager.id,
        description: 'Construction of a 20-story residential tower'
      },
      {
        name: 'Shopping Mall Expansion',
        code: 'PROJ-003',
        location: '789 Pine Rd, City',
        budget: 12000000,
        startDate: new Date('2024-03-01'),
        status: 'planning',
        progress: 0,
        projectManagerId: projectManager.id,
        description: 'Expansion of existing shopping mall'
      }
    ], { ignoreDuplicates: true });
    console.log('Projects created');

    // Create Materials
    const materials = await Material.bulkCreate([
      {
        name: 'Cement',
        unit: 'bags',
        unitCost: 8.50,
        minStock: 100,
        category: 'Construction Materials',
        description: 'Portland cement bags'
      },
      {
        name: 'Steel Rebar',
        unit: 'tons',
        unitCost: 650.00,
        minStock: 5,
        category: 'Construction Materials',
        description: 'Reinforcement steel bars'
      },
      {
        name: 'Concrete Blocks',
        unit: 'pieces',
        unitCost: 2.50,
        minStock: 500,
        category: 'Construction Materials',
        description: 'Standard concrete blocks'
      },
      {
        name: 'Sand',
        unit: 'cubic meters',
        unitCost: 45.00,
        minStock: 20,
        category: 'Construction Materials',
        description: 'Fine construction sand'
      },
      {
        name: 'Gravel',
        unit: 'cubic meters',
        unitCost: 55.00,
        minStock: 20,
        category: 'Construction Materials',
        description: 'Coarse aggregate'
      },
      {
        name: 'Paint',
        unit: 'gallons',
        unitCost: 35.00,
        minStock: 50,
        category: 'Finishing Materials',
        description: 'Interior/exterior paint'
      },
      {
        name: 'Tiles',
        unit: 'square meters',
        unitCost: 25.00,
        minStock: 100,
        category: 'Finishing Materials',
        description: 'Ceramic floor tiles'
      },
      {
        name: 'Electrical Wire',
        unit: 'meters',
        unitCost: 3.50,
        minStock: 500,
        category: 'Electrical',
        description: 'Copper electrical wire'
      }
    ], { ignoreDuplicates: true });
    console.log('Materials created');

    // Create Suppliers
    const suppliers = await Supplier.bulkCreate([
      {
        name: 'ABC Construction Supplies',
        contactPerson: 'Mike Johnson',
        email: 'mike@abcsupplies.com',
        phone: '555-0101',
        address: '100 Industrial Blvd, City'
      },
      {
        name: 'XYZ Building Materials',
        contactPerson: 'Sarah Williams',
        email: 'sarah@xyzmaterials.com',
        phone: '555-0102',
        address: '200 Commerce St, City'
      },
      {
        name: 'Global Hardware Co',
        contactPerson: 'David Brown',
        email: 'david@globalhardware.com',
        phone: '555-0103',
        address: '300 Trade Ave, City'
      }
    ], { ignoreDuplicates: true });
    console.log('Suppliers created');

    // Create Employees
    const employees = await Employee.bulkCreate([
      {
        employeeId: 'EMP-001',
        firstName: 'Robert',
        lastName: 'Smith',
        email: 'robert@crms.com',
        phone: '555-1001',
        position: 'Site Foreman',
        hireDate: new Date('2023-01-15'),
        hourlyRate: 25.00
      },
      {
        employeeId: 'EMP-002',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@crms.com',
        phone: '555-1002',
        position: 'Carpenter',
        hireDate: new Date('2023-02-01'),
        hourlyRate: 22.00
      },
      {
        employeeId: 'EMP-003',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james@crms.com',
        phone: '555-1003',
        position: 'Electrician',
        hireDate: new Date('2023-02-15'),
        hourlyRate: 28.00
      },
      {
        employeeId: 'EMP-004',
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa@crms.com',
        phone: '555-1004',
        position: 'Plumber',
        hireDate: new Date('2023-03-01'),
        hourlyRate: 26.00
      },
      {
        employeeId: 'EMP-005',
        firstName: 'Michael',
        lastName: 'Taylor',
        email: 'michael@crms.com',
        phone: '555-1005',
        position: 'Laborer',
        hireDate: new Date('2023-03-15'),
        hourlyRate: 18.00
      }
    ], { ignoreDuplicates: true });
    console.log('Employees created');

    console.log('Database seeding completed successfully!');
    console.log('\nDefault Login Credentials:');
    console.log('Admin: admin@crms.com / admin123');
    console.log('Project Manager: pm@crms.com / admin123');
    console.log('Procurement Officer: proc@crms.com / admin123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
}

seed();

