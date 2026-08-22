
import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validate =(schema) => {

    // let schema={
    //     body:schema,
    //     params:schema,
    //     query:schema

    // }

    return (req, res, next) => {
            if (schema?.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema?.params) {
                req.params = schema.params.parse(req.params);
            }
            if (schema?.query) {
                req.query = schema.query.parse(req.query);
            }
            next();
    }


}



export default validate;