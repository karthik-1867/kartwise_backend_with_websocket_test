import mongoose from "mongoose";

const CreateExpenseGroupSchema = new mongoose.Schema({
    title:{
      type:String,
      unique:true,
      require:true
    },
    uploadImage:{
       type:String,
       default:""
    },
    groupOwner:{
      type:String,
      default:""
    },
    members : {
        type:Array,
        default:[]
     },
     received:{
        type:Number,
        default:0
     },
     spent:{
        type:Number,
        default:0
     },
})


export default mongoose.model("CreateExpenseGroup",CreateExpenseGroupSchema)