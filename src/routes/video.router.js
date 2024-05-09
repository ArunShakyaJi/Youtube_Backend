import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";

import { 
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controler.js";

const router = Router()

// router.route("/publish").post(
//     upload.fields([
//         {
//             name: "thumbnail",
//             maxCount: 1
//         }, {
//             name: "videoFile",
//             maxCount: 1
//         }
//     ]),
//     publishAVideo
// )

// router.route("/").get(getAllVideos)
// router.route("/v/:videoId").get(verifyJWT , getVideoById)

router.route("/publish").get(getAllVideos).post(verifyJWT, upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }, {
        name: "videoFile",
        maxCount: 1
    }
]), publishAVideo)

router
    .route("/v/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

    router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

// console.log("publish pr aagya");

export default router;
