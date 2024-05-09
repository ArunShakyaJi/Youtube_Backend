import {Router} from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from "../controllers/Like.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
const router = Router()

// console.log("like routes");
router.use(verifyJWT);


router.route("/videos").get(getLikedVideos)
router.route("/toggle/video/:videoId").post(toggleVideoLike)
router.route("/toggle/tweet/:tweetId").post(toggleTweetLike)
router.route("/toggle/comment/:commentId").post(toggleCommentLike)
export default router;