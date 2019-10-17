/**
 * Employees functions
 */
var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("../cred")
var { CustomException, CustomExceptionCodes } = require("./exceptions")
var { zeroPad, getYear, validateEmployeeID, validateRoleID, generateRandomString, hashPassword } = require("./util")
var dynamodbClient = new DynamoDB({ region: "us-east-1" })

/**
 * Register Employee
 */
exports.registerEmployee = ({ newEmployee }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        if (validateRoleID(newEmployee.roleID))
            dynamodbClient.updateItem({
                Key: {
                    [dirDB.key]: {
                        S: "counters"
                    }
                },
                TableName: dirDB.name,
                UpdateExpression: "set empidx = empidx + :val",
                ExpressionAttributeValues: {
                    ":val": {
                        N: "1"
                    }
                },
                ReturnValues: "UPDATED_NEW"
            }, (error, data) => {
                if (error) {
                    console.error("Register Employee Error: Update Counter")
                    console.error(error)
                    resolve({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                    })
                } else {
                    const counters = data.Attributes
                    const id = `E0${getYear()}${zeroPad(counters.empidx.N, 4)}`
                    const salt = generateRandomString(16)
                    dynamodbClient.putItem({
                        Item: {
                            ...DynamoDB.Converter.marshall(newEmployee),
                            [dirDB.key]: {
                                S: id
                            },
                            [dirDB.index.type.key]: {
                                S: "employee"
                            },
                            "salt": {
                                S: salt
                            },
                            "hash": {
                                S: hashPassword(id.toLowerCase(), salt)
                            }
                        },
                        TableName: dirDB.name
                    }, (error) => {
                        if (error) {
                            console.error("Register Employeee Error: Put Employee")
                            console.error(error)
                            resolve({
                                error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                            })
                        } else {
                            resolve({
                                ...newEmployee,
                                id
                            })
                        }
                    })
                }
            })
        else {
            resolve({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid RoleID")
            })
        }
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})

/**
 * Update Employee
 */
exports.updateEmployee = ({ employee }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        if (employee.id && validateEmployeeID(employee.id)) {
            if (validateRoleID(employee.roleID))
                dynamodbClient.updateItem({
                    TableName: dirDB.name,
                    Key: {
                        [dirDB.key]: {
                            S: employee.id
                        }
                    },
                    UpdateExpression: "Set #n = :n, address = :a, email= :e, mobile = :m, bank = :b, roleID = :r, isActive = :iA",
                    ConditionExpression: "attribute_exists(#i)",
                    ExpressionAttributeNames: {
                        "#n": "name",
                        "#i": "id"
                    },
                    ExpressionAttributeValues: {
                        ":n": {
                            S: employee.name
                        },
                        ":a": {
                            S: employee.address
                        },
                        ":e": {
                            S: employee.email
                        },
                        ":m": {
                            S: employee.mobile
                        },
                        ...DynamoDB.Converter.marshall({ ":b": employee.bank }),
                        ":r": {
                            S: employee.roleID
                        },
                        ":iA": {
                            BOOL: employee.isActive
                        },
                    }
                }, (error) => {
                    if (error) {
                        if (error.code === "ConditionalCheckFailedException") {
                            resolve({
                                error: CustomException(CustomExceptionCodes.NotFound, "Employee Not Found")
                            })
                        } else {
                            console.error("Update Employee Error: update Employee")
                            console.error(error)
                            resolve({
                                error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                            })
                        }
                    } else {
                        resolve(employee)
                    }
                })
            else {
                resolve({
                    error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid RoleID")
                })
            }
        } else {
            resolve({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Employee id")
            })
        }
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})

/**
 * Employee List
 */
exports.listEmployees = ({ nextToken }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        dynamodbClient.query({
            TableName: dirDB.name,
            IndexName: dirDB.index.type.name,
            KeyConditionExpression: "#t = :t",
            ProjectionExpression: "#i, #n, roleID, isActive",
            ExpressionAttributeNames: {
                "#i": "id",
                "#n": "name",
                "#t": "type"
            },
            ExpressionAttributeValues: {
                ":t": {
                    S: "employee"
                }
            },
            ExclusiveStartKey: nextToken ? {
                S: nextToken
            } : undefined
        }, (error, data) => {
            if (error) {
                console.error("List Employee Error: query Employee")
                console.error(error)
                resolve({
                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                })
            } else {
                resolve({
                    nextToken: data.LastEvaluatedKey ? data.LastEvaluatedKey.S : null,
                    employees: data.Items.map(value => DynamoDB.Converter.unmarshall(value))
                })
            }
        })
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})

/**
 * Employee Info
 */
exports.employeeInfo = ({ employeeID }, user) => new Promise((resolve) => {
    if (user && (user.type === "admin" || employeeID === user.username)) {
        if (validateEmployeeID(employeeID)) {
            dynamodbClient.getItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: employeeID
                    }
                },
                ProjectionExpression: "#i, #n, roleID, address, email, mobile, bank, isActive",
                ExpressionAttributeNames: {
                    "#i": "id",
                    "#n": "name"
                },
            }, (error, data) => {
                if (error) {
                    console.error("Employee Info Error: get Employee")
                    console.error(error)
                    resolve({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                    })
                } else {
                    if (data.Item) {
                        resolve({
                            ...DynamoDB.Converter.unmarshall(data.Item)
                        })
                    } else {
                        resolve({
                            error: CustomException(CustomExceptionCodes.NotFound, "Employee Not Found")
                        })
                    }
                }
            })
        } else {
            resolve({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Employee id")
            })
        }
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})
