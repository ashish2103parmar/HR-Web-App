/**
 * Main Page
 */

var express = require("express");
var graphqlHTTP = require("express-graphql");
var cors = require('cors')

var app = express();

/**
 * Enable Cors
 */
app.use(cors({
    origin: 'http://localhost:3000', // change for Production
    allowedHeaders: ["X-Session-Key", "Content-Type"]
}))

/**
 * Health test for ELB
 */
app.get('/teststatus', (req, res) => {
    res.send()
})

/**
 * Error Handling
 */
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send()
})

/**
 * Start Server
 */
app.listen(8080, () => {
    console.log("Server Started..!")
})