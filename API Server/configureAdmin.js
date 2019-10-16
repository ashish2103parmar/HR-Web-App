/**
 * Script to Configure Admin
 * usage: node ./configureAdmin.js
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("./cred")
var { generateRandomString, hashPassword } = require("./lib/util")
const salt = generateRandomString(16)
const password = "admin123"     // set required password

// Default Config
const admin = {
    [dirDB.key]: {
        S: "admin"
    },
    [dirDB.index.type.key]: {
        S: "admin"
    },
    salt: {
        S: salt
    },
    hash: {
        S: hashPassword(password, salt)
    },
}

var dynamoDBClient = new DynamoDB({ region: "us-east-1" })

dynamoDBClient.putItem({
    Item: admin,
    TableName: dirDB.name
}, (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log("Admin Configured")
    }
})