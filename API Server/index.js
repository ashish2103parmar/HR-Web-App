/**
 * Main Page
 */

var express = require("express");
var graphqlHTTP = require("express-graphql");
var cors = require('cors')
var { validateSession } = require("./lib/session")
var app = express();
var { schema, root } = require("./graphql")

/**
 * Enable Cors
 */
app.use(cors({
    origin: 'http://localhost:3000', // change for Production
    allowedHeaders: ["X-Session-Key", "X-Session-User", "Content-Type"]
}))

/**
 * Health test for ELB
 */
app.get('/teststatus', (req, res) => {
    res.send()
})

/**
 * Graphql handler
 */
app.use("/graphql", validateSession, (req, res) => graphqlHTTP({
    schema: schema,
    rootValue: root,
    context: req.context,
    graphiql: true,
})(req, res))

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