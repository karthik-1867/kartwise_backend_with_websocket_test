import express from "express"
import { verifyToken } from "../verifiyToken.js";
import Notification from "../models/Notification.js";
import users from "../models/Users.js";
import { createError } from "../error.js";

const router = express.Router();

router.get("/getNotification/:id",verifyToken,async(req,res,next)=>{
    try{
        const user = await users.findById(req.user.id);
        console.log(user.Notifications)
        console.log(req.params.id)

        if(!user.Notifications.includes(req.params.id)) return next(createError(403,"Invalid access"))
        const notification = await Notification.findById(req.params.id);
        res.status(200).json(notification);
    }catch(e){
        res.status(404).json(e.message);
    }
})

router.delete("/deleteNotification/:id",verifyToken,async(req,res,next)=>{
    try{

        await users.findByIdAndUpdate(req.user.id,{$pull:{Notifications:req.params.id}});
        res.status(200).json("done")
    }catch(e){
        res.status(401).json(e.message)
    }
})

export default router;