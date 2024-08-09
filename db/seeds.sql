\c company_db

INSERT INTO departments (name)
VALUES ('Engineering'), ('Sales'), ('Finance');

INSERT INTO roles (title, salary, department_id)
VALUES ('Software Engineer', 80000, 1), 
       ('Salesperson', 60000, 2), 
       ('Accountant', 70000, 3);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('John', 'Doe', 1, NULL), 
       ('Jane', 'Smith', 2, 1), 
       ('Mike', 'Johnson', 3, 2);
