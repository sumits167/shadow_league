import mongoose from "mongoose";
import ApiError from '../utils/ApiError.js'
import { DB_NAME } from "../constants/index.js";

const dbConnect=async()=>{

    try {
      
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        console.log("Database connected successfully");
    } catch (error) {
        console.log("Error=",error.message)
        throw new ApiError(500,"Error while connecting database");
    }
}

export default dbConnect;