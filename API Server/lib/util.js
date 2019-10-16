/**
 * Utility Functions
 */

const crypto = require("crypto");

/**
 * Generate Salt
 */
exports.generateRandomString = (len) => {
    return crypto.randomBytes(len).toString('base64');
}

/**
 * Hash Password
 */
exports.hashPassword = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`base64`);
}

/**
 * Validate Password
 */
exports.validatePassword = (password) => {
    var re = /^.{6,}$/;         // minimum 6 chars
    return re.test(password)
}

/**
 * Validate EmployeeID
 * Current Format: E0YYXXXX
 * E0 - Employee ID ver - 0
 * YY - last two digits of year empolyee was registered
 * XXXX - 4-digit number
 */
exports.validateEmployeeID = (employeeID) => {
    var re = /E0[0-9]{2}[0-9]{4}$/;
    return re.test(employeeID)
}

/**
 * Validate RoleID
 * Current Format: R0YYXX
 * R0 - Report ID ver - 0
 * YY - last two digits of year role was created
 * XX - 2-digit number
 */
exports.validateRoleID = (roleID) => {
    var re = /R0[0-9]{2}[0-9]{2}$/;
    return re.test(roleID)
}

/**
 * Validate ReportID
 * Current Format: W0YYXXXXXXXXX
 * W0 - Report ID ver - 0
 * YY - last two digits of year role was created
 * XXXXXXXXX - 10-digit number
 */
exports.validateReportID = (ReportID) => {
    var re = /W0[0-9]{2}[0-9]{10}$/;
    return re.test(ReportID)
}


/**
 * Zero Padding
 */
exports.zeroPad = (num, places) => {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}

/**
 * Get last two digits of Year
 */
exports.getYear = () => (new Date().getFullYear().toString().substr(-2))