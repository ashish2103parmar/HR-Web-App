/**
 * Report Functions
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB, reportDB } = require("../cred")
var { CustomException, CustomExceptionCodes } = require("./exceptions")
var { zeroPad, getYear, validateEmployeeID } = require("./util")
var dynamodbClient = new DynamoDB({ region: "us-east-1" })

/**
 * Report Work Hours
 */
exports.reportWorkHours = ({ employeeID, workHours, description }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        if (validateEmployeeID(employeeID)) {
            dynamodbClient.getItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: employee.id
                    }
                },
                ProjectionExpression: "#i, roleID, isActive",
                ExpressionAttributeNames: {
                    "#i": "id",
                },
            }, (error, data) => {
                if (error) {
                    console.error("Report Work Hours Error: get Employee")
                    console.error(error)
                    resolve({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                    })
                } else {
                    if (data.Item) {
                        const employeeDetails = DynamoDB.Converter.unmarshall(data.Item)
                        dynamodbClient.getItem({
                            TableName: employeeDetails.roleID,
                            Key: {
                                [dirDB.key]: {
                                    S: data.Item.roleID.S
                                }
                            },
                            ProjectionExpression: "#i, #n, description, perHourRate",
                            ExpressionAttributeNames: {
                                "#i": "id",
                                "#n": "name"
                            },
                        }, (error, data) => {
                            if (error) {
                                console.error("Report Work Hours Error: get Role")
                                console.error(error)
                                resolve({
                                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                                })
                            } else {
                                if (data.Item) {
                                    const roleDetails = DynamoDB.Converter.unmarshall(data.Item)
                                    dynamodbClient.updateItem({
                                        [dirDB.key]: {
                                            S: "counters"
                                        },
                                        TableName: dirDB.name,
                                        UpdateExpression: "set reportidx = reportidx + :val",
                                        ExpressionAttributeValues: {
                                            ":val": 1
                                        },
                                        ReturnValues: "UPDATED_NEW"
                                    }, (error, data) => {
                                        if (error) {
                                            console.error("Report Work Hours Error: Update Counter")
                                            console.error(error)
                                            resolve({
                                                error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                                            })
                                        } else {
                                            const counters = data.Attributes
                                            const id = `W0${getYear()}${zeroPad(counters.reportidx.N, 10)}`
                                            const details = {
                                                timestamp: Date.now(), // epoch in ms
                                                amount: roleDetails.perHourRate * workHours,
                                                status: "Pending",
                                                description,
                                                workHours,
                                                role: roleDetails
                                            }
                                            dynamodbClient.putItem({
                                                Item: {
                                                    [reportDB.key]: {
                                                        S: id
                                                    },
                                                    [reportDB.index.employeeID.key]: {
                                                        S: employeeID
                                                    },
                                                    ...DynamoDB.Converter.marshall(details)
                                                },
                                                TableName: reportDB.name
                                            }, (error) => {
                                                if (error) {
                                                    console.error("Report Work Hours Error: Put Report")
                                                    console.error(error)
                                                    resolve({
                                                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                                                    })
                                                } else {
                                                    resolve({
                                                        ...details,
                                                        id
                                                    })
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    resolve({
                                        error: CustomException(CustomExceptionCodes.NotFound, "Role Not Found")
                                    })
                                }
                            }
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