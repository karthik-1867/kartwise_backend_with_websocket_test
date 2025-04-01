import { createError } from "../error.js";
import Notification from "../models/Notification.js";
import Users from "../models/Users.js";
import { io } from "../index.js";

export const getAllUser = async(req,res) =>{

    const allUser = await Users.find();
    const user = await Users.findById(req.user.id);
    console.log("req user")
    console.log(user);
    const updateUsers = allUser.filter((i)=>(!user.PendingInviteRequest.includes(i._id)&&!user.inviteRequest.includes(i._id)&&!user.inviteAcceptedUsers.includes(i._id)&&i._id!=req.user.id))
    console.log("req user");
    res.status(200).json(updateUsers)
}

export const inviteRequest = async(req,res,next)=>{
     console.log("params")
     console.log(req.params.id);

     if(req.user.id !== req.params.id){
        try{
           
           const getUser = await Users.findById(req.user.id)

           const notification = new Notification({"type":"Invite","message":`${getUser.name} has sent u request`,"senderId":req.user.id})

           await notification.save()

           console.log(notification)

           await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteRequest:req.user.id},$push:{Notifications:notification.id}});
           const currentUpdate = await Users.findByIdAndUpdate(req.user.id,{$addToSet:{PendingInviteRequest:req.params.id}},{new:true});
           io.emit("expenseUpdated", "created");
           res.status(200).json(notification);



        }catch(e){
            res.status(404).json(e.message);
        }
     }else{
        next(createError(401,"u cannot invite urself"));
     }
}

export const acceptInvite = async(req,res,next) => {

    const user = await Users.findById(req.user.id);

    if(user.inviteRequest.includes(req.params.id) || !user.inviteAcceptedUsers.includes(req.params.id))
    {

        try{

            user.inviteAcceptedUsers.push(req.params.id);
            user.inviteRequest.pull(req.params.id);
            user.PendingInviteRequest.pull(req.params.id);

            console.log("before save")
            console.log(user);
            await user.save();

            console.log("after notification",user)

            const notification = new Notification({"type":"Message","message":`${user.name} accepted your request`,"senderId":req.user.id})

            await notification.save()
            const receiver = await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteAcceptedUsers:req.user.id},$push:{Notifications:notification.id},$pull:{PendingInviteRequest:req.user.id}})
            
            io.emit("expenseUpdated", "created");
            res.status(200).json(user);
        }catch(e){
            res.status(404).json("failure");
        }
    }else{
        next(createError(401,"no user request"))
    }
    
}

export const rejectPendingInvite = async(req,res,next)=>{
    try{
        const user = await Users.findByIdAndUpdate(req.user.id,{$pull:{PendingInviteRequest:req.params.id}},{new:true});
        await Users.findByIdAndUpdate(req.params.id,{$pull:{inviteRequest:req.user.id}})
        io.emit("expenseUpdated", "created");
        res.status(200).json(user);
    }catch(e){
       res.status(401).json(e.message);
    }
}

export const removeInvite = async(req,res,next) => {
    const user = await Users.findById(req.user.id);

    try{
        if(user.inviteAcceptedUsers.includes(req.params.id)){
          
            const notification = new Notification({"type":"Message","message":`${user.name} rejected your request`,"senderId":req.user.id})

            await notification.save()
            await Users.findByIdAndUpdate(req.params.id,{$pull:{inviteAcceptedUsers:req.user.id},$push:{Notifications:notification.id}})
            user.inviteAcceptedUsers.pull(req.params.id);
            user.save()
            io.emit("expenseUpdated", "created");
            res.status(200).json("removed user")
        }else{
            res.status(401).json("no such users")
        }
    }catch(e){
       res.status(401).json(e.message);
    }
}



export const removeInviteRequest = async(req,res,next) => {
    

    try{
        const user = await Users.findByIdAndUpdate(req.user.id,{$pull:{inviteRequest:req.params.id}},{new:true});
        const notification = new Notification({"type":"Message","message":`${user.name} rejected your request`,"senderId":req.user.id})
        await notification.save()
       await Users.findByIdAndUpdate(req.params.id,{$push:{Notifications:notification.id},$pull:{PendingInviteRequest:req.user.id}})
       io.emit("expenseUpdated", "created"); 
       res.status(200).json(user);
    }catch(e){
       res.status(401).json(e.message);
    }
}

export const getUser = async(req,res,next)=>{
    try{
        const user = await Users.findById(req.param.id)
        res.status(200).json(user)
    }catch(e){
        next(createError(404,"not found"))
    }
}

export const searchUsers = async(req,res,next)=>{
    try{
       const searchUser = await Users.find({ name: { $regex: req.body.search, $options: "i" } })
       
       res.status(200).json(searchUser)
    }catch(e){
       next(createError(404,e.message))
    }
}