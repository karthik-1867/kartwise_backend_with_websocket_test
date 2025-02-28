import jwt from "jsonwebtoken"
import { createError } from "./error.js";

export const verifyToken = (req,res,next) =>{
    console.log(req.cookies);
    const token = req.cookies.access_token

    if(!token) return next(createError(401,"unauthorized"));

    jwt.verify(token,process.env.SECRET_KEY,(err,user)=>{
        if(err) return next(createError(401,"unauthorizesd"));

        //imp as once user token is authenticated this can be used without even specifing in parameter or body.
        req.user = user;
        next();
    })



}