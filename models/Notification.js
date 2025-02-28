import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    type:{
        type:String,
        default:"Message"
    },
    message:{
        type:String,
        default:""
    },
    senderId:{
        type:String,
        default:""
    }
},{timestamps:true})

export default mongoose.model("Notification",NotificationSchema)