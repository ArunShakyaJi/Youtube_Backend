import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try {
       const connectInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)

        console.log(`\n MongoDb Connected: ${connectInstance.connection.host}`)

    } catch (error) {
        console.log("Mongoose Error", error);
        process.exit(1) ;
    }
}

export default connectDB ;