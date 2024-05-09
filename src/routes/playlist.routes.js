import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();


router.use(verifyJWT , upload.none());

router.route("/").post(createPlaylist);
router.route("/:playlistId").get(getPlaylistById)
                            .patch(updatePlaylist)
                            .delete(deletePlaylist);
                    
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/play/:userId").get(getUserPlaylists);

router.route("/p/").get()
export default router;
