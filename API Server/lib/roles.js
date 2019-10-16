/**
 * Role Funcitons
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("../cred")
var { CustomException, CustomExceptionCodes } = require("./exceptions")
var { zeroPad, getYear, validateRoleID } = require("./util")
var dynamodbClient = new DynamoDB({ region: "us-east-1" })

/**
 * Create Role
 */
exports.createRole = ({ newRole }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        dynamodbClient.updateItem({
            [dirDB.key]: {
                S: "counters"
            },
            TableName: dirDB.name,
            UpdateExpression: "set roleidx = roleidx + :val",
            ExpressionAttributeValues: {
                ":val": 1
            },
            ReturnValues: "UPDATED_NEW"
        }, (error, data) => {
            if (error) {
                console.error("Create Role Error: Update Counter")
                console.error(error)
                resolve({
                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                })
            } else {
                const counters = data.Attributes
                const id = `R0${getYear()}${zeroPad(counters.roleidx.N, 2)}`
                dynamodbClient.putItem({
                    Item: {
                        [dirDB.key]: {
                            S: id
                        },
                        [dirDB.index.type.key]: {
                            S: "role"
                        },
                        name: {
                            S: newRole.name
                        },
                        description: {
                            S: newRole.description
                        },
                        perHourRate: {
                            N: newRole.perHourRate.toString()
                        }
                    },
                    TableName: dirDB.name
                }, (error) => {
                    if (error) {
                        console.error("Create Role Error: Put Role")
                        console.error(error)
                        resolve({
                            error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                        })
                    } else {
                        resolve({
                            ...newRole,
                            id
                        })
                    }
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
 * update Role
 */
exports.updateRole = ({ role }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        if (role.id && validateRoleID(role.id)) {
            dynamodbClient.updateItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: role.id
                    }
                },
                UpdateExpression: "Set #n = :n, description = :d, perHourRate = :pR",
                ConditionExpression: "attribute_exists(#i)",
                ExpressionAttributeNames: {
                    "#n": "name",
                    "#i": "id"
                },
                ExpressionAttributeValues: {
                    ":n": {
                        S: role.name
                    },
                    ":d": {
                        S: role.description
                    },
                    ":pR": {
                        N: role.perHourRate.toString()
                    }
                }
            }, (error) => {
                if (error) {
                    if (error.code === "ConditionalCheckFailedException") {
                        resolve({
                            error: CustomException(CustomExceptionCodes.NotFound, "Role Not Found")
                        })
                    } else {
                        console.error("Update Role Error: update Role")
                        console.error(error)
                        resolve({
                            error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                        })
                    }
                } else {
                    resolve(role)
                }
            })
        } else {
            resolve({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Role id")
            })
        }
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})

/**
 * List Roles
 */
exports.listRoles = ({ nextToken }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        dynamodbClient.query({
            TableName: dirDB.name,
            IndexName: dirDB.index.type.name,
            KeyConditionExpression: "#t = :t",
            ProjectionExpression: "#i, #n, description, perHourRate",
            ExpressionAttributeNames: {
                "#i": "id",
                "#n": "name",
                "#t": "type"
            },
            ExpressionAttributeValues: {
                ":t": "role"
            },
            ExclusiveStartKey: nextToken ? {
                S: nextToken
            } : undefined
        }, (error, data) => {
            if (error) {
                console.error("List Role Error: query Role")
                console.error(error)
                resolve({
                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                })
            } else {
                resolve({
                    nextToken: data.LastEvaluatedKey ? data.LastEvaluatedKey.S : null,
                    ...DynamoDB.Converter.unmarshall({ roles: { L: data.Items } })
                })
            }
        })
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})