/**
 * Script to Initialize Counters 
 * usage: node ./initCounter.js
 * Note: USE ONLY ONCE!
 */

var DynamoDB = require("aws-sdk/clients/dynamodb")
var { dirDB } = require("./cred")

// Default Config
const intiCounter = {
    [dirDB.key]: {
        S: "counters"
    },
    [dirDB.index.type.key]: {
        S: "default"
    },
    roleidx: {
        N: "0"
    },
    empidx: {
        N: "0"
    },
    reportidx: {
        N: "0"
    }
}

var dynamoDBClient = new DynamoDB({ region: "us-east-1" })

dynamoDBClient.putItem({
    Item: intiCounter,
    TableName: dirDB.name
}, (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log("Counters Initialized")
    }
})