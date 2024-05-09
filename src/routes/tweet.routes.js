import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"

const router = Router()

// console.log("tweet routes");
// this will apply jwt to all routers in this file  
 router.use(verifyJWT , upload.none());

router.route("/").post(createTweet);
router.route("/user/:userId").get( getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;