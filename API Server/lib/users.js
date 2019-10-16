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
            ProjectionExpression: "hash, salt"
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
                                    sessionKey
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
