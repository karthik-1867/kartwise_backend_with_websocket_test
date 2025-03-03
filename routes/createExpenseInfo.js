import express from "express"

import { verifyToken } from "../verifiyToken.js";
import createExpenseInfo from "../models/createExpenseInfo.js";
import Users from "../models/Users.js";
import CreateExpenseGroup from "../models/CreateExpenseFroup.js"
import { createError } from "../error.js";
import Notification from "../models/Notification.js";

const router = express.Router();


router.post("/createExpenseDetails",verifyToken,async(req,res,next)=>{
   
    try{
        console.log(req.body)
        const expensegroup = await CreateExpenseGroup.findById(req.body.expenseGroupId);
        console.log("expenseGroup")
        console.log(expensegroup)
        console.log(req.body.users)
        
        const ownerDetail = await Users.findOne({name:req.body.owner});
        const userDetail = await Users.findById(req.user.id);
        console.log(ownerDetail)
        console.log(userDetail)
        req.body.users = req.body.users.map((i)=>(
            i.id == ownerDetail.id ? {... i, "paidBack": i.expense,"owner":true,"status":"paid"} : {... i, "paidBack":0,"owner":false,"status":"pending"}
        ))

        req.body.users = req.body.users.filter((i)=>i.expense>0 || i.owner == true);

        if(req.body.users.length == 0) return next(createError(401,"Please add expense"))
        
        req.body.users = req.body.users.filter(i=>expensegroup.members.includes(i.id))
        console.log("final")
        console.log(req.body.users)
        console.log("before error")
        const val = (req.body.users.reduce((acc,cur)=>(acc+Number(cur.expense)),0))
        console.log("passed")
        const ownerPaidBack = req.body.users.filter((i)=>i.owner==true)[0].expense

        console.log("total")
        console.log(val);
        req.body = {...req.body,"paid":val,"ownerReceived":ownerPaidBack,"ownerId":ownerDetail.id}

        console.log("owner id")
        console.log(ownerDetail.id);

        const expense = new createExpenseInfo(req.body);
        await expense.save();

        const groupId = req.body.users.map((i)=>i.id)
        const notification = new Notification({"type":"message","groupName":`${expensegroup.title}`,"ExpenseName":`${req.body.groupName}`,"ExpenseOwner":`${ownerDetail.name}`,"message":`${userDetail.name} has created group ${req.body.groupName}. ${ownerDetail.name} will be the owner of group. Amount of ${val}rs has been contributed by ${ownerDetail.name} of which his part of ${ownerPaidBack} is deducted. Remaining ${val-ownerPaidBack}rs needs to be paid to ${ownerDetail.name}`})

        await notification.save()

        await CreateExpenseGroup.findByIdAndUpdate(expensegroup.id,{$inc:{spent:val}})

        const result = await Users.updateMany(
            { _id: { $in: [...groupId] } }, // Match users with the given userIds
            { $push: {createExpenseInfo:expense.id,Notifications:notification.id},
              $inc:{expenditure:val,recoveredExpenditure:ownerPaidBack}
            } // Apply theupdate
        );

        
        await Users.findByIdAndUpdate(ownerDetail.id,{
            $inc:{contributed:val,paidBack:0,urShare:ownerPaidBack}
        })

        res.status(200).json(result);
    }catch(e){

        if(e.message.includes("Cast to ObjectId failed for value")) next(createError(401,"Please select group"))
        if(e.message.includes("duplicate key error")) next(createError(403,"This expense already exist"))
        next(createError(401,e.message))
           
    }
})

router.get("/getExpenseDetails/:id",verifyToken,async(req,res,next)=>{

    try{

        const groupDetail = await createExpenseInfo.findById(req.params.id)
        res.status(200).json(groupDetail);
    }catch(e){
        res.status(401).json(e);
    }
})

router.post("/updateExpenseDetails/:id",verifyToken,async(req,res,next)=>{
    try{

        console.log(req.params.id)
        const currentInfoStatus = await createExpenseInfo.findById(req.params.id);

        console.log(currentInfoStatus.users)

        req.body.users = req.body.users.filter((i)=>{
            if(currentInfoStatus.users.some((u)=>u.id==i.id)){
               return i
            }
        })
        console.log(req.body.users)

        req.body.users = req.body.users.filter((i)=>(i.paidBack > 0))

        console.log("settlement")
        console.log(req.body.users);
        if(req.body.users.length == 0) return res.status(200).json("No settlements. Please add up paidback money and proceed"); 
        const val = req.body.users.reduce((acc,cur)=>(acc+cur.paidBack),0);

        if(currentInfoStatus.ownerId !== req.user.id) return next(createError(403,`Only expense group owner can update this.That is ${currentInfoStatus.owner}`));
        let inputUserDetail = ""
        let errorMessage = [];
        for (let current_input of req.body.users){
            const i = currentInfoStatus.users.filter((prev)=>prev.id===current_input.id && (prev.paidBack+current_input.paidBack <= prev.expense));
            inputUserDetail = await Users.findById(current_input.id)
            if(i.length==0){
                const prev = currentInfoStatus.users.filter((item)=>item.id==current_input.id)[0];
                console.log("prev");
                console.log(prev)

                errorMessage.push(`user ${inputUserDetail.name} is paying more then expense. ${prev.status == "paid" ? "Already account settled" : `Extra ${(prev.paidBack+current_input.paidBack)-prev.expense}rs is been getting paid please pay only ${prev.expense-prev.paidBack} and settle ` }`)
            }
        }

        if(errorMessage.length > 0){
            return next(createError(403,errorMessage.join()))
        }

        const ownerDetail = await Users.findOne({name:currentInfoStatus.owner});
        await Users.findByIdAndUpdate(ownerDetail.id,{
            $inc:{recived:val}
        })

        console.log("proceeded")

        //if putting map inside for loop then always ensure list is updated at the end by creating copy
        const members = currentInfoStatus.users.map((i)=>i.id);
        for (let current_input of currentInfoStatus.users){
            //we are trying to mutate but thats not returing updated things
            // req.body.users = req.body.users.map((i)=>(
            //     (current_input.id == i.id && current_input.paidBack+i.paidBack == current_input.expense) ? {...i,"status":"paid"} : current_input.expense-current_input.paidBack > 0 ? {...i,"status":"partially paid"} : i
            // ))

           for(let users of req.body.users){
               if(current_input.id==users.id && users.paidBack>0){
                   let userDetail = await Users.findById(users.id);
                   let notification = ""
                   if(current_input.paidBack+users.paidBack<current_input.expense){
                   notification = new Notification({"type":"message","ExpenseName":`${currentInfoStatus.groupName}`,"ExpenseOwner":`${ownerDetail.name}`,"message":`${currentInfoStatus.groupName} Group Notification : ${userDetail.name} has paid back ${current_input.paidBack+users.paidBack}rs to ${currentInfoStatus.owner}. Pending amount : ${current_input.expense-(current_input.paidBack+users.paidBack)}rs to be paid`})
                   }else{
                    notification = new Notification({"type":"message","ExpenseName":`${currentInfoStatus.groupName}`,"ExpenseOwner":`${ownerDetail.name}`,"message":`${currentInfoStatus.groupName} Group Notification : ${userDetail.name} has settled up ${current_input.paidBack+users.paidBack}rs to ${currentInfoStatus.owner}.`})
                   }
                   await notification.save();
                   await Users.updateMany(
                    { _id: { $in: [...members] } }, 
                    { $push:{Notifications:notification.id}
                    }
                );
               }
           }



            req.body.users = req.body.users.map((user) => {
                if (current_input.id === user.id) {
                  
                  console.log("curent input")
                  console.log(current_input.paidBack + user.paidBack)
                  console.log(current_input.expense)
                  current_input.paidBack + user.paidBack === current_input.expense
                  console.log(current_input.paidBack + user.paidBack == current_input.expense)
                  if (current_input.paidBack + user.paidBack == current_input.expense) {
                    return { ...user, status: "paid" };
                  }

                  else if (current_input.paidBack + user.paidBack > 0) {
                    return { ...user, status: "partially paid" };
                  }
                }
                
                return user;
              });
        }

        console.log(currentInfoStatus.ownerId)
        console.log(req.user.id)
        
        
        console.log(currentInfoStatus)
        if(currentInfoStatus?.ownerReceived<currentInfoStatus.paid){

            console.log(members)
            
            const updated_val = val + currentInfoStatus?.ownerReceived
            await Users.updateMany(
                { _id: { $in: [...members] } }, 
                { $inc:{recoveredExpenditure:val}
                }
            );
            currentInfoStatus.ownerReceived = updated_val;

            await CreateExpenseGroup.findByIdAndUpdate(currentInfoStatus.expenseGroupId,{$inc:{received:val}})
        }
        if(currentInfoStatus?.paid-currentInfoStatus?.ownerReceived == 0){
            currentInfoStatus.allSettled = "allSettled"

            let notification = new Notification({"type":"message","message":`${currentInfoStatus.groupName} Group Notification : All members of ${currentInfoStatus.groupName} expense has settled up ${currentInfoStatus?.ownerReceived}rs to ${currentInfoStatus.owner}.`})
            await notification.save();
            await Users.updateMany(
             { _id: { $in: [...members] } }, 
             { $push:{Notifications:notification.id}
             })
        }

        for (let user of req.body.users) {
            console.log("user")
            console.log(user);

            if( user.paidBack>0){
                await Users.findByIdAndUpdate(user.id,{
                    $inc:{paidBack:user.paidBack}
                })
            }

            const result = await createExpenseInfo.updateOne(
              { _id: req.params.id },
              {
                $set: { 
                  "users.$[elem].status" : user.status
                },
                $inc:{

                    "users.$[elem].paidBack": user.paidBack
                }
              },
              {
                arrayFilters: [
                  { "elem.id": user.id }, // Update friend with this specific ID
                ],
              }
            );
        }



        await currentInfoStatus.save();

        res.status(200).json(currentInfoStatus);
    }catch(e){
        res.status(401).json(e.message)
    }
})


router.delete("/deleteExpenseDetails/:id",verifyToken,async(req,res,next)=>{
    
    try{
        const expense = await createExpenseInfo.findById(req.params.id);
        if(expense.ownerId!=req.user.id) return next(createError(403,`Only group owner that is ${expense.owner} can delete this expense`))

        const expenseMembers = expense.users.map((i)=>i.id);
        const notification = new Notification({"type":"message","ExpenseName":`${expense.groupName}`,"ExpenseOwner":`${expense.owner}`,"message":`${expense.owner} has deleted group ${expense.groupName}`})
    
        await notification.save()
        await Users.updateMany(
            { _id: { $in: [...expenseMembers] } }, 
            { $pull: {createExpenseInfo:req.params.id},
              $set :{expenditure:0,recoveredExpenditure:0,paidBack:0,recived:0,contributed:0,urShare:0},
              $push:{Notifications:notification.id}
            }
        );
    
        await createExpenseInfo.findByIdAndDelete(req.params.id)
        res.status(200).json("deleted")
    }catch(e){
        res.status(403).json(e.message)
    }

})


router.post("/memberDetails",verifyToken,async(req,res,next)=>{

    try{
        console.log(req.body.members)
        const member = await Users.find({_id: { $in: req.body.members} })
        res.status(200).json(member)
    }catch(e){
        res.status(401).json(e)
    }
})


export default router;