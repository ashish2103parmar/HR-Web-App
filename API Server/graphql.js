/**
 * Graphql Schema, Handlers
 */
var { buildSchema } = require('graphql');
var userFunctions = require('./lib/users');
var roleFunctions = require("./lib/roles");
var employeeFunctions = require("./lib/employee");

/**
 * Schema
 */
exports.schema = buildSchema(`
    type Error {
        code: String!
        msg:String!
    }

    type RoleInfo {
        id: ID
        name: String
        description: String
        perHourRate: Int
        error: Error
    }

    
    type BankInfo {
        name: String!
        IFSC: String!
        accNo: String!   
    }

    type RoleList {
        roles: [RoleInfo]
        error: Error
        nextToken: String
    }

    type EmployeeInfo {
        id: ID!
        name: String!
        roleID: ID!
        address: String!
        email: String!
        mobile: String!
        bank: BankInfo!
        isActive: Boolean!
        error: Error
    }

    type EmployeeBasic {
        id: ID!
        name: String!
        roleID: ID!
        isActive: Boolean!
    }

    type EmployeeList {
        employees: [EmployeeBasic]
        error: Error
        nextToken: String
    }

    type ReportInfo {
        id: ID!
        timestamp: Int!
        workHours: Int!
        description: String!
        role: RoleInfo
        amount: Int!
        status: String!
        paymentID: String
        bank: BankInfo
        error: Error
    }

    type ReportList {
        reports: [ReportInfo]
        error: Error
        nextToken: String
    }

    type Query {
        listRoles(nextToken: String): RoleList
        listEmployees(nextToken: String): EmployeeList
        employeeInfo(employeeID: ID!): EmployeeInfo
        listReport(employeeID: ID!, nextToken: String): ReportList
    }

    type SessionCredentials {
        username: String
        sessionKey: String
        error: Error
    }

    input Role {
        id: ID
        name: String!
        description: String!
        perHourRate: Int!
    }
    
    input Employee {
        id: ID
        name: String!
        roleID: ID!
        address: String!
        email: String!
        mobile: String!
        bank: BankInfo!
        isActive: Boolean!
    }

    type Mutation {
        login(username: String!, password: String!): SessionCredentials
        createRole(newRole: Role!): RoleInfo
        updateRole(role: Role!): RoleInfo
        registerEmployee(newEmployee: Employee!): EmployeeInfo
        updateEmployee(employee: Employee!): EmployeeInfo
        reportWorkHours(employeeID: ID!, workHours: Int!, description: String!): ReportInfo
        makePayment(employeeID: ID!, reportID: ID!): ReportInfo
    }
`);

/**
 * Functions and Handlers
 */
exports.root = {
    login: userFunctions.login,
    createRole: roleFunctions.createRole,
    updateRole: roleFunctions.updateRole,
    listRoles: roleFunctions.listRoles,
    registerEmployee: employeeFunctions.registerEmployee,
    updateEmployee: employeeFunctions.updateEmployee,
    listEmployees: employeeFunctions.listEmployees,
    employeeInfo: employeeFunctions.employeeInfo,

}