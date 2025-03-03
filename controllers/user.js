import { createError } from "../error.js";
import Notification from "../models/Notification.js";
import Users from "../models/Users.js";


export const getAllUser = async(req,res) =>{

    const allUser = await Users.find();
    try{
        console.log("req user");
        res.status(200).json(allUser)
    }catch(e){
    console.log(e)
    }
}

export const inviteRequest = async(req,res,next)=>{
     console.log("params")
     console.log(req.params.id);

     if(req.user.id !== req.params.id){
        try{
           

           const notification = new Notification({"type":"Invite","Message":"","senderId":req.user.id})

           await notification.save()

           console.log(notification)

           await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteRequest:req.user.id},$push:{Notifications:notification.id}});
          

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

    if(user.inviteRequest.includes(req.params.id))
    {

        try{
            const notification = new Notification({"type":"Message","message":`${user.name} accepted your request`,"senderId":req.user.id})

            await notification.save()
            const receiver = await Users.findByIdAndUpdate(req.params.id,{$addToSet:{inviteAcceptedUsers:req.user.id},$push:{Notifications:notification.id}})
            
            user.inviteAcceptedUsers.push(req.params.id);
            user.inviteRequest.pull(req.params.id);

            console.log("before save")
            console.log(user);
            user.save();
            io.emit("expenseUpdated", "created");
            res.status(200).json("success");
        }catch(e){
            res.status(404).json("failure");
        }
    }else{
        next(createError(401,"no user request"))
    }
    
}

export const removeInvite = async(req,res,next) => {
    const user = await Users.findById(req.user.id);

    try{
        if(user.inviteAcceptedUsers.includes(req.params.id)){
            await Users.findByIdAndUpdate(req.params.id,{$pull:{inviteAcceptedUsers:req.user.id}})
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
        const user = await Users.findByIdAndUpdate(req.user.id,{$pull:{inviteRequest:req.params.id}});
        const notification = new Notification({"type":"Message","message":`${user.name} rejected your request`,"senderId":req.user.id})

        await notification.save()

        const receiver = await Users.findByIdAndUpdate(req.params.id,{$push:{Notifications:notification.id}})
        io.emit("expenseUpdated", "created");
        res.status(200).json(user);
    }catch(e){
       res.status(401).json(e.message);
    }
}