import express from "express"
import { acceptInvite, getAllUser, inviteRequest, rejectPendingInvite, removeInvite, removeInviteRequest } from "../controllers/user.js";
import { signin, signup } from "../controllers/auth.js";
import { verifyToken } from "../verifiyToken.js";
import Users from "../models/Users.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/signin",signin);

router.get("/getAllUser",verifyToken,getAllUser);

router.post("/inviteRequest/:id",verifyToken,inviteRequest);

router.post("/acceptInvite/:id",verifyToken,acceptInvite);

router.post("/removeInvitedUser/:id",verifyToken,removeInvite)

router.post("/removeInviteRequest/:id",verifyToken,removeInviteRequest)

router.post("/rejectPendingInvite/:id",verifyToken,rejectPendingInvite)
rejectPendingInvite
router.get("/getUser/:id",async(req,res,next)=>{
    try{

        const user = await Users.findById(req.params.id);
        res.status(200).json(user)
    }catch(e){
        res.status(401).json(e.message)
    }
})

export default router;
 