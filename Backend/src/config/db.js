import mongoose from "mongoose"
import { config } from "./config.js"

async function connectToDb() {
    // console.log(config.MONGO_URI)
    await mongoose.connect(config.MONGO_URI)
    console.log('Connected to Db')
}

export default connectToDb