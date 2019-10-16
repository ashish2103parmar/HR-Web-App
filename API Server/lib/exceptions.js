/**
 * Custom Exception
 */

exports.CustomException = (code, msg) => ({ code, msg })

exports.CustomExceptionCodes = {
    UnknownError: "UnknownError",
    AlreadyExists: "AlreadyExists",
    InvalidRequest: "InvalidRequest",
    NotFound: "NotFound",
    ValidationFailed: "ValidationFailed",
    AccessDenied: "AccessDenied",
    //InvalidAuthHeader: "InvalidAuthHeader",
    //CreateUserFailed: "CreateUserFailed",
    //UserNotFound: "UserNotFound",
    //ProcessingError: "ProcessingError",
    //Expired: "Expired"
}