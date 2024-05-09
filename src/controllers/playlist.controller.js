import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    // console.log("req.user", req.user?._id);
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    })

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }

    return res.status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }
    // console.log("userId", userId);
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));

});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // const playlistVideos = await Playlist.aggregate([
    //     {
    //         $match: {
    //             _id: new mongoose.Types.ObjectId(playlistId)
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             localField: "videos",
    //             foreignField: "_id",
    //             as: "videos",
    //         }
    //     },
    //     {
    //         $match: {
    //             "videos.isPublished": true
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "owner",
    //             foreignField: "_id",
    //             as: "owner",
    //         }
    //     },
    //     {
    //         $addFields: {
    //             totalVideos: {
    //                 $size: "$videos"
    //             },
    //             totalViews: {
    //                 $sum: "$videos.views"
    //             },
    //             owner: {
    //                 $first: "$owner"
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             name: 1,
    //             description: 1,
    //             createdAt: 1,
    //             updatedAt: 1,
    //             totalVideos: 1,
    //             totalViews: 1,
    //             videos: {
    //                 _id: 1,
    //                 "videoFile.url": 1,
    //                 "thumbnail.url": 1,
    //                 title: 1,
    //                 description: 1,
    //                 duration: 1,
    //                 createdAt: 1,
    //                 views: 1
    //             },
    //             owner: {
    //                 username: 1,
    //                 fullName: 1,
    //                 "avatar.url": 1
    //             }
    //         }
    //     }

    // ]);

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $match: {
                "videos.isPublished": true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "videos.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $addFields: {
                "videos.owner": { $first: "$ownerDetails" }
            }
        },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$videos.views" },
                videos: { $push: "$videos" },
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                _id: 0,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                },
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar : 1
                }
            }
        }
    ]);
    

    return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id")
    }

    const playlist = await Playlist.findById(playlistId)

    const video = await Video.findById(videoId)

    if (!playlist || !video) {
        throw new ApiError(404, "Playlist or video not found")
    }


    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: video?._id
            }
        },
        {
            new: true
        }
    )

    if (!updatePlaylist) {
        throw new ApiError(500, "Failed to add video to playlist")
    }

    return res.status(200)
        .json(new ApiResponse(200, updatePlaylist, "video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    const playlist = await Playlist.findById(playlistId)

    const video = await Video.findById(videoId)

    // console.log("playlist", playlist)
    // console.log("video", video)

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    // console.log("playlist.owner", playlist.owner)
    // console.log("video.owner", video.owner)
    // console.log("req.user?._id", req.user?._id)

    // if (
    //     (playlist.owner?.toString() && video.owner.toString()) !==
    //     req.user?._id.toString()
    // ) {
    //     throw new ApiError(
    //         404,
    //         "only owner can remove video from thier playlist"
    //     );
    // }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to remove video from playlist")
    }


    return res.status(200)
        .json(new ApiResponse(200, updatedPlaylist, "video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);
    // console.log("playlist", playlist);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // if (playlist.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(400, "only owner can delete the playlist");
    // }

    await Playlist.findByIdAndDelete(playlist?._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "playlist updated successfully"
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description

            }
        },
        {
            new: true

        })

    return res.status(200)
        .json(new ApiResponse(200, playlist, "playlist updated successfully"))
})
export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}