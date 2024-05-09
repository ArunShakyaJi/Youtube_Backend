
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken'; 
import { User } from '../models/user.model.js';

 const verifyJWT = asyncHandler(async (req, res, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
 
    if(!token){
      // if token is invalid, throw an error
     throw new ApiError(401 , "Unauthorized request")
    } 
     // verify token
     // if token is valid, add user to req object
    const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET )
    
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
 
      if(!user){
         //discuss frontened
         throw new ApiError(401 , "Invalid access Token")
      }
      req.user = user;
      next()
   } catch (error) {
    throw new ApiError (401 , error?.message )
   }
}) 

export { verifyJWT }