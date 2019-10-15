/**
 * Graphql Schema, Handlers
 */
var { buildSchema } = require('graphql');


/**
 * Schema
 */
exports.schema = buildSchema(`
    type Query {
        listReport(employeeID: ID!, nextToken: String): [Report]
        employeeInfo(employeeID: ID): EmployeeInfo
        listEmployees(nextToken: String): [Employee]
        listRoles(nextToken: String): [Role]
        listPayments(employeeID: ID!, nextToken: String): [PaymentInfo]
    }

    type Mutation {
        registerEmployee(newEmployee: EmployeeInfo!): EmployeeInfo
        updateEmployee(employee: EmployeeInfo!): EmployeeInfo
        createRole(newRole: Role!): Role
        updateRole(roleID: ID!): Role
        makeReport(employeeID :ID!, newReport: Report!): Report
        makePayment(employeeID :ID!, amount: Int!): PaymentInfo
    }
`);

/**
 * Functions and Handlers
 */
exports.root = {

}