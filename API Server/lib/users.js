/**
 * User Login and Session Functions
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("../cred")
var { generateRandomString, hashPassword, validatePassword, validateEmployeeID } = require("./util")
var { CustomException, CustomExceptionCodes } = require("./exceptions")

var dynamodbClient = new DynamoDB({ region: "us-east-1" })

/**
 * User Login 
 * Note: Only one session is allowed per user. any new login will invalidate previous session
 */
exports.login = ({ username, password }) => new Promise((resolve) => {
    if ((username === "admin" || validateEmployeeID(username)) && validatePassword(password)) {
        dynamodbClient.getItem({
            TableName: dirDB.name,
            Key: {
                [dirDB.key]: {
                    S: username
                }
            },
            ProjectionExpression: "#h, salt, #t",
            ExpressionAttributeNames: {
                "#h": "hash",
                "#t": "type"
            }
        }, (error, data) => {
            if (error) {
                console.error("Login Error: Get User")
                console.error(error)
                resolve({
                    error: CustomException(CustomExceptionCodes.UnknownError, "Some thing went wrong")
                })
            } else {
                const user = data.Item
                if (user) {
                    if (user.hash.S === hashPassword(password, user.salt.S)) {
                        const sessionKey = generateRandomString(64)
                        dynamodbClient.updateItem({
                            TableName: dirDB.name,
                            Key: {
                                [dirDB.key]: {
                                    S: username
                                }
                            },
                            ExpressionAttributeNames: {
                                "#SK": "sessionKey"
                            },
                            ExpressionAttributeValues: {
                                ":SK": {
                                    S: sessionKey
                                }
                            },
                            UpdateExpression: "SET #SK = :SK",
                        }, (error) => {
                            if (error) {
                                console.error("Login Error: Update User")
                                console.error(error)
                                resolve({
                                    error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                                })
                            } else {
                                resolve({
                                    username,
                                    sessionKey,
                                    type: user.type.S
                                })
                            }
                        })
                    } else {
                        resolve({
                            error: CustomException(CustomExceptionCodes.ValidationFailed, "Incorrect Password")
                        })
                    }
                } else {
                    resolve({
                        error: CustomException(CustomExceptionCodes.NotFound, "User Not Found")
                    })
                }
            }
        })
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Username/Password")
        })
    }
})


/**
 * Reset Password
 */
exports.resetPassword = ({ employeeID }, user) => new Promise((resolve) => {
    if (user && user.type === "admin") {
        if (validateEmployeeID(employeeID)) {
            const salt = generateRandomString(16)
            dynamodbClient.updateItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: employeeID
                    }
                },
                ExpressionAttributeNames: {
                    "#h": "hash",
                    "#s": "salt",
                    "#i": dirDB.key
                },
                ExpressionAttributeValues: {
                    ":h": {
                        S: hashPassword(employeeID.toLowerCase(), salt)
                    },
                    ":s": {
                        S: salt
                    }
                },
                UpdateExpression: "SET #h = :h, #s = :s",
                ConditionExpression: "attribute_exists(#i)",
            }, (error) => {
                if (error) {
                    if (error.code === "ConditionalCheckFailedException") {
                        resolve({
                            error: CustomException(CustomExceptionCodes.NotFound, "Employee Not Found")
                        })
                    } else {
                        console.error("Reset Password Error: update Password")
                        console.error(error)
                        resolve({
                            error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                        })
                    }
                } else {
                    resolve({})
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
 * changePassword(): Error
 */
exports.changePassword = ({ oldPassword, newPassword }, user) => new Promise((resolve) => {
    if (user && user.username) {
        if (validatePassword(oldPassword) && validatePassword(newPassword)) {
            dynamodbClient.getItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: user.username
                    }
                },
                ProjectionExpression: "#h, salt",
                ExpressionAttributeNames: {
                    "#h": "hash",
                }
            }, (error, data) => {
                if (error) {
                    console.error("Change Password Error: Get User")
                    console.error(error)
                    resolve({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Some thing went wrong")
                    })
                } else {
                    const userDetails = data.Item
                    if (userDetails) {
                        if (userDetails.hash.S === hashPassword(oldPassword, userDetails.salt.S)) {
                            const salt = generateRandomString(16)
                            dynamodbClient.updateItem({
                                TableName: dirDB.name,
                                Key: {
                                    [dirDB.key]: {
                                        S: user.username
                                    }
                                },
                                ExpressionAttributeNames: {
                                    "#h": "hash",
                                    "#s": "salt",
                                },
                                ExpressionAttributeValues: {
                                    ":h": {
                                        S: hashPassword(newPassword, salt)
                                    },
                                    ":s": {
                                        S: salt
                                    }
                                },
                                UpdateExpression: "SET #h = :h, #s = :s",
                            }, (error) => {
                                if (error) {
                                    console.error("Change Password Error: update newPassword")
                                    console.error(error)
                                    resolve({
                                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                                    })
                                } else {
                                    resolve({})
                                }
                            })
                        } else {
                            resolve({
                                error: CustomException(CustomExceptionCodes.ValidationFailed, "Incorrect Password")
                            })
                        }
                    } else {
                        resolve({
                            error: CustomException(CustomExceptionCodes.NotFound, "Employee Not Found")
                        })
                    }
                }
            })
        } else {
            resolve({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Password")
            })
        }
    } else {
        resolve({
            error: CustomException(CustomExceptionCodes.AccessDenied, "Access Denied")
        })
    }
})
