import mongoose from "mongoose";

const CreateExpenseInfo = new mongoose.Schema({
    groupName:{
        type:String,
        unique:true,
        require:true
    },
    expenseGroupId:{
         type:String,
         require:true
    },
    owner:{
        type:String,
        require:true
    },
    ownerReceived:{
        type:Number,
        default:0
    },
    paid:{
        type:Number,
        default:0
    },
    allSettled:{
        type:String,
        default:"pending"
    },
    uploadImage:{
        type:String,
        default:""
    },
    users:{
        type:Array,
        default:[]
    },
    amountReturnedUser:{
        type:Array,
        default:[]
    },
    ownerId:{
        type:String,
        require:true,
        default:""
    }
},{timestamps:true})


export default mongoose.model("CreateExpenseInfo",CreateExpenseInfo)