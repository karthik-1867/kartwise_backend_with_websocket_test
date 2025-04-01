import mongoose from "mongoose";

const AcknowledgeSchema = new mongoose.Schema({
    ownerid:{
      type:String,
      require:true
    },
    groupid:{
       type:String,
       default:""
    },
    groupName:{
      type:String,
      default:""
    },
    name:{
        type:String,
        default:""
    },
    owner : {
        type:String,
        default:""
     },
     expense:{
        type:Number,
        default:0
     },
     paidBack:{
        type:Number,
        default:0
     },
     status:{
        type:String,
        default:"pending"
     },
     evidence:{
      type:String,
      default:""
     },
     acknowledgeStatus:{
       type:String,
     }
},{timestamps:true})


export default mongoose.model("Acknowledge",AcknowledgeSchema)