import express from "express"
import { verifyToken } from "../verifiyToken.js";
import { createError } from "../error.js";
const router = express.Router();
import AcknoledgeMessage from "../models/AcknoledgeMessage.js";
import Users from "../models/Users.js";
import mongoose from "mongoose";
import { io } from "../index.js";

router.post("/createMessage",verifyToken,async(req,res,next)=>{
  
    try{
        const owner = await Users.find({name:req.body.owner});
        
        console.log(owner)
        const newMessage = new AcknoledgeMessage(req.body);
        await newMessage.save()
        
        owner[0].Acknowledge.push(newMessage._id);
        const user = await Users.findByIdAndUpdate(req.user.id,{$push:{AcknowledgeMessageStatus:{onwerid:req.user.id,groupid:req.body.groupid,ackid:newMessage._id}}})
        await owner[0].save()
        io.emit("expenseUpdated", "created");
        res.status(200).json(newMessage)
    }catch(e){
       res.status(404).json(e.message)
    }
})

router.get("/getMessage/:id",verifyToken,async(req,res,next)=>{
    try{
         const getMessage = await AcknoledgeMessage.findById(req.params.id)
         res.status(200).json(getMessage);
    }catch(e){
       res.status(404).json(e.message)
    }
})

router.get("/getMessageBasedOnGroupName/:groupName",verifyToken,async(req,res,next)=>{
    try{
        const getMessage = await AcknoledgeMessage.find({groupName:req.params.groupName})
        res.status(200).json(getMessage);       
    }catch(e){
        res.status(200).json(getMessage);
    }
})

router.post("/updateAcceptOrRejectMessage/:id",verifyToken,async(req,res,next)=>{
    try{
        const getMessage = await AcknoledgeMessage.findByIdAndUpdate(req.params.id,{acknowledgeStatus:req.body.acknowledgeStatus},{new:true})

        const objectIdToPull = new mongoose.Types.ObjectId(req.params.id);
        const updated = await Users.findByIdAndUpdate(req.user.id,{$pull:{Acknowledge:objectIdToPull}})
        console.log("tyfgi",updated.Acknowledge,req.params.id)
        io.emit("expenseUpdated", "created");
        res.status(200).json(updated)
    }catch(e){
       res.status(404).json(e.message)
    }
})


export default router;