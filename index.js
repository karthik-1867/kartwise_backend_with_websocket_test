import express from "express"
import mongoose from "mongoose";
import dotenv from "dotenv";
import users from "./routes/users.js";
import expenseGroup from "./routes/createExpenseGroup.js"
import expense from "./routes/createExpenseInfo.js"
import notification from "./routes/notification.js"
import acknowledge from "./routes/acknowlegdeMessage.js"
import cookieParser from "cookie-parser";
import cors from "cors"
import { Server } from "socket.io";
import http from "http";
dotenv.config()

const connect = () => {
   console.log("initiaed")
    mongoose.connect(process.env.MONGO_URL).then(()=>{
        console.log("connected to mongodb")
    }).catch((e)=>{
        console.log(e);
    })
}

const app = express();

const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.URL, // React app URL
    credentials: true, // Allow cookies to be sent
  },
});



// app.listen(8800,()=>{
//     console.log("connected")
//     connect();
// })





server.listen(8800, () => {
    console.log("Server running on http://localhost:8800");
    connect();
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.emit("expenseUpdated","recahed")
  
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  export { io };

app.use(cors({
    origin: process.env.URL, // Your React app URL
    credentials: true, // Allow cookies to be sent
  }));
  

app.use(cookieParser())
app.use(express.json())
app.use("/user",users)
app.use("/ExpenseGroup",expenseGroup)
app.use("/expense",expense)
app.use("/notification",notification)
app.use("/acknowledge",acknowledge)

app.use((err,req,res,next)=>{

    const status = err.status || 500;
    const message = err.message || "something went wrong";
    return res.status(status).json({
      success:false,
      status,
      message
    })
})

