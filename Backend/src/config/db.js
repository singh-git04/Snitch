import mongoose from "mongoose";
import dns from "dns";
import { config } from "./config.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function connectToDb() {
  console.log("mongo url--------------", config.MONGO_URI);

  const conn = await mongoose.connect(config.MONGO_URI);

  console.log("MONGODB Connected", conn.connection.host);
}

export default connectToDb;