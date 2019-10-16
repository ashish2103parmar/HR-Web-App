/**
 * Resource Names and Credentials
 */

// Directory DB
exports.dirDB = {
    name: "dir-table",
    key: "id",
    index: {
        type: {
            name: "type-index",
            key: "type"
        }
    }
};

// Report DB
exports.reportDB = {
    name: "report-table",
    key: "reportid",
    index: {
        employeeID: {
            name: "empid-index",
            key: "empid"
        }
    }
};
