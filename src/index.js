// require('dotenv').config({ path: './env'})

import dotenv from 'dotenv'
import connectDB from './db/index.js'
import app from './app.js'

dotenv.config({ path: './.env' })
connectDB()
    .then(() => {

        app.on("error", (error) => {
            console.log(" express Error", error);
            throw error;
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log("MongDb connection src/index Error", error)
        process.exit(1)

    });







// const app = express()
// import express from 'express'

//     ; (async () => {
//         try {
//             await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
//             app.on("error", (error) => {
//                 console.log(" express Error", error);
//                 throw error ;
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`Server is running on port ${process.env.PORT}`)
//             })
//         } catch (error) {
//             console.log("Error", error);

//         }
//     })()