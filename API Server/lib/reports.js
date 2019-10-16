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
                        S: employeeID
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
                            TableName: dirDB.name,
                            Key: {
                                [dirDB.key]: {
                                    S: employeeDetails.roleID
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
                                        Key: {
                                            [dirDB.key]: {
                                                S: "counters"
                                            }
                                        },
                                        TableName: dirDB.name,
                                        UpdateExpression: "set reportidx = reportidx + :val",
                                        ExpressionAttributeValues: {
                                            ":val": {
                                                N: "1"
                                            }
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
                                                timestamp: Math.round(Date.now() / 1000), // epoch in sec
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

/**
 * Make Payment
 */
exports.makePayment = ({ reportID }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        dynamodbClient.updateItem({
            Key: {
                [reportDB.key]: {
                    S: reportID
                }
            },
            TableName: reportDB.name,
            UpdateExpression: "set #s = :s, paymentID = :p",
            ConditionExpression: `#s = :cs AND attribute_exists(${[reportDB.key]})`,
            ExpressionAttributeNames: {
                "#s": "status"
            },
            ExpressionAttributeValues: {
                ":s": {
                    S: "Cleared"
                },
                ":cs": {
                    S: "Pending"
                },
                ":p": {
                    S: `P${Math.floor(Math.random() * 999999999)}`
                }
            },
            ReturnValues: "ALL_NEW"
        }, (error, data) => {
            if (error) {
                if (error.code === "ConditionalCheckFailedException") {
                    resolve({
                        error: CustomException(CustomExceptionCodes.InvalidRequest, "Payment Processed/Invalid ReportID")
                    })
                } else {
                    console.error("Make Payment Error: update Report")
                    console.error(error)
                    resolve({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                    })
                }
            } else {
                var details = DynamoDB.Converter.unmarshall(data.Attributes)
                details["id"] = details[reportDB.key]
                delete details[reportDB.key]
                delete details[reportDB.index.employeeID.key]
                resolve(details)
            }
        })
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})

/**
 * List Report
 */
exports.listReport = ({ employeeID, nextToken }, user) => new Promise((resolve) => {
    if (user && (user.type === "admin" || user.username === employeeID)) {
        dynamodbClient.query({
            TableName: reportDB.name,
            IndexName: reportDB.index.employeeID.name,
            KeyConditionExpression: "#eID = :eID",
            ExpressionAttributeNames: {
                "#eID": reportDB.index.employeeID.key
            },
            ExpressionAttributeValues: {
                ":eID": {
                    S: employeeID
                }
            },
            ExclusiveStartKey: nextToken ? {
                S: nextToken
            } : undefined
        }, (error, data) => {
            if (error) {
                console.error("List Report Error: query Report")
                console.error(error)
                resolve({
                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                })
            } else {
                var reports = data.Items.map((details) => {
                    details = DynamoDB.Converter.unmarshall(details)
                    details["id"] = details[reportDB.key]
                    delete details[reportDB.key]
                    delete details[reportDB.index.employeeID.key]
                    return details
                })
                resolve({
                    nextToken: data.LastEvaluatedKey ? data.LastEvaluatedKey.S : null,
                    reports
                })
            }
        })
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})