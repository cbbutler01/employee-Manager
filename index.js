const express = require('express');
const inquirer = require('inquirer');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
    user: 'postgres',
    password: 'Bzavion18#',
    host: 'localhost',
    database: 'company_db'
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startApp();
});

const queryDatabase = async (query, params = []) => {
    try {
        const { rows } = await pool.query(query, params);
        return rows;
    } catch (err) {
        console.error('Database query error:', err);
    }
};

const startApp = async () => {
    try {
        const { action } = await inquirer.prompt({
            name: 'action',
            type: 'list',
            message: 'What would you like to do?',
            choices: [
                'View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'Exit'
            ]
        });

        switch (action) {
            case 'View all departments':
                await viewAllDepartments();
                break;
            case 'View all roles':
                await viewAllRoles();
                break;
            case 'View all employees':
                await viewAllEmployees();
                break;
            case 'Add a department':
                await addDepartment();
                break;
            case 'Add a role':
                await addRole();
                break;
            case 'Add an employee':
                await addEmployee();
                break;
            case 'Update an employee role':
                await updateEmployeeRole();
                break;
            case 'Exit':
                await pool.end();
                break;
            default:
                console.log(`Invalid action: ${action}`);
                await startApp();
                break;
        }
    } catch (err) {
        console.error('Error in startApp:', err);
    }
};

const viewAllDepartments = async () => {
    const query = 'SELECT * FROM departments';
    const departments = await queryDatabase(query);
    console.table(departments);
    await startApp();
};

const viewAllRoles = async () => {
    const query = `
        SELECT roles.id, roles.title, roles.salary, departments.name AS department 
        FROM roles
        LEFT JOIN departments ON roles.department_id = departments.id
    `;
    const roles = await queryDatabase(query);
    console.table(roles);
    await startApp();
};

const viewAllEmployees = async () => {
    const query = `
        SELECT employee.id, employee.first_name, employee.last_name, roles.title, departments.name AS department, roles.salary,
            CONCAT(manager.first_name, ' ', manager.last_name) AS manager
        FROM employee
        LEFT JOIN roles ON employee.role_id = roles.id
        LEFT JOIN departments ON roles.department_id = departments.id
        LEFT JOIN employee manager ON manager.id = employee.manager_id
    `;
    const employees = await queryDatabase(query);
    console.table(employees);
    await startApp();
};

const addDepartment = async () => {
    const { name } = await inquirer.prompt({
        name: 'name',
        type: 'input',
        message: 'What is the name of the new department?'
    });

    const query = 'INSERT INTO departments (name) VALUES ($1)';
    await queryDatabase(query, [name]);
    console.log(`Added ${name} to departments!`);
    await startApp();
};

const addRole = async () => {
    const departments = await queryDatabase('SELECT * FROM departments');
    const departmentChoices = departments.map(dept => ({
        name: dept.name,
        value: dept.id
    }));

    const { title, salary, department_id } = await inquirer.prompt([
        { name: 'title', type: 'input', message: 'What is the title of the new role?' },
        { name: 'salary', type: 'input', message: 'What is the salary of the new role?' },
        { name: 'department_id', type: 'list', message: 'Which department does the new role belong to?', choices: departmentChoices }
    ]);

    const query = 'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)';
    await queryDatabase(query, [title, salary, department_id]);
    console.log(`Added ${title} role!`);
    await startApp();
};

const addEmployee = async () => {
    const roles = await queryDatabase('SELECT * FROM roles');
    const employees = await queryDatabase('SELECT * FROM employee');

    const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id
    }));

    const managerChoices = employees.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));
    managerChoices.unshift({ name: 'None', value: null });

    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        { name: 'first_name', type: 'input', message: "What is the employee's first name?" },
        { name: 'last_name', type: 'input', message: "What is the employee's last name?" },
        { name: 'role_id', type: 'list', message: "What is the employee's role?", choices: roleChoices },
        { name: 'manager_id', type: 'list', message: "Who is the employee's manager?", choices: managerChoices }
    ]);

    const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
    await queryDatabase(query, [first_name, last_name, role_id, manager_id]);
    console.log(`Added ${first_name} ${last_name} to employees!`);
    await startApp();
};

const updateEmployeeRole = async () => {
    const employees = await queryDatabase('SELECT * FROM employee');
    const roles = await queryDatabase('SELECT * FROM roles');

    const employeeChoices = employees.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
    }));

    const roleChoices = roles.map(role => ({
        name: role.title,
        value: role.id
    }));

    const { employee_id, role_id } = await inquirer.prompt([
        { name: 'employee_id', type: 'list', message: 'Select the employee to update.', choices: employeeChoices },
        { name: 'role_id', type: 'list', message: 'Select the new role for the employee.', choices: roleChoices }
    ]);

    const query = 'UPDATE employee SET role_id = $1 WHERE id = $2';
    await queryDatabase(query, [role_id, employee_id]);
    console.log('Employee role updated successfully');
    await startApp();
};
