import { trusted } from "mongoose";
import { createError } from "../error.js";
import Users from "../models/Users.js";
import bcrypt from "bcryptjs";
import jwt  from "jsonwebtoken";

export const signup = async(req,res)=>{
   try{  
    //   const newUser = new users(req.body);
     const salt = bcrypt.genSaltSync(10);
     const hashPassword = bcrypt.hashSync(req.body.password,salt);

     const newUser = new Users({...req.body,password:hashPassword})

      await newUser.save()
      console.log(newUser)
      res.status(200).json(newUser);
   }catch(e){
    res.status(404).json(e.message);
   }
}


export const signin = async(req,res,next) => {
    try{
      console.log("req",req.body)
       const user = await Users.findOne({email:req.body.email});

       if(!user) return next(createError(404,"user not found"))
       
       const isCorrect = await bcrypt.compare(req.body.password,user.password);

       if(!isCorrect) return next(createError(404,"wrong password"))

        const {password, ...others} = user._doc;
       //create token
       const token = jwt.sign({id:user._id}, process.env.SECRET_KEY)       

       //sending token to cookies
       res.cookie("access_token",token,{
        httpOnly:true,
        secure:true,
        sameSite:"None"
       }).status(200).json(others);
    }catch(e){
        res.status(404).json(e.message)
    }
}