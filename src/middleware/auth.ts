import type { NextFunction, Request, Response } from "express";

const auth = () => {
    return async (req : Request, res : Response, next : NextFunction) => {
    // console.log("auth middleware");
    // console.log(req.headers);
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    };
    next();
        };
     }

     export default auth;