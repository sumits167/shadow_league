import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";


const errorhandler = (err, req, res, next) => {


    // Unexpected error defaults
    let statusCode = 500;
    let message = "Internal Server Error";
    let code = "INTERNAL_SERVER_ERROR";
    let isUser = true
    let details = null;

    // ApiError
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        isUser = err.isUser;
        details = err.details;
    }
    // Zod validation
    else if (err instanceof ZodError) {
        statusCode = 400;
        message =err.issues[0]?.message??"Validation failed";
        code = "VALIDATION_ERROR";
        isUser = err.isUser;
        details = err.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
        }));
    }


    // Log unexpected errors
    if (statusCode >= 500) {
        console.error(err);
    }


    console.log("error : ",{
        success: false,
        statusCode,
        code,
        message,
        details,
        isUser
    })

    return res.status(statusCode).json({
        success: false,
        statusCode,
        code,
        message,
        details,
        isUser
    });

}

export default errorhandler