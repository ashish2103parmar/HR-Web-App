/**
 * Session Validation Function
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("../cred")
var { validateEmployeeID } = require("./util")
var { CustomException, CustomExceptionCodes } = require("./exceptions")

var dynamodbClient = new DynamoDB({ region: "us-east-1" })


/**
 * Validate Session and provide Context
 */
exports.validateSession = (req, res, next) => {
    if (req.headers["x-session-key"] && req.headers["x-session-user"]) {
        const username = req.headers["x-session-user"]
        const sessionKey = req.headers["x-session-key"]
        if (validateEmployeeID(username) || username === "admin") {
            dynamodbClient.getItem({
                TableName: dirDB.name,
                Key: {
                    [dirDB.key]: {
                        S: username
                    }
                },
                ProjectionExpression: "sessionKey, #t",
                ExpressionAttributeNames: {
                    "#t": "type"
                }
            }, (error, data) => {
                if (error) {
                    console.error("Session Validation Error: Get User")
                    console.error(error)
                    res.status(400).send({
                        error: CustomException(CustomExceptionCodes.UnknownError, "Something went wrong")
                    })
                } else {
                    const userDetails = data.Item
                    if (userDetails) {
                        if (userDetails.sessionKey.S === sessionKey) {
                            req.context = {
                                username,
                                type: userDetails.type.S
                            }
                            next()
                        } else {
                            res.status(400).send({
                                error: CustomException(CustomExceptionCodes.ValidationFailed, "Invalid Session Key")
                            })
                        }
                    } else {
                        res.status(400).send({
                            error: CustomException(CustomExceptionCodes.NotFound, "User Not Found")
                        })
                    }
                }
            })
        } else {
            res.status(400).send({
                error: CustomException(CustomExceptionCodes.InvalidRequest, "Invalid Session Data")
            })
        }
    } else {
        next()
    }
}