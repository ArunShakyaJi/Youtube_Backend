import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    // Match stage for filtering by user ID
    if (userId) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Match stage for filtering published videos
    pipeline.push({ $match: { isPublished: true } });
 
    // Search stage
    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        });
    }

    // Sorting stage
    let sortStage = { $sort: { createdAt: -1 } };
    if (sortBy && sortType) {
        sortStage = { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } };
    }
    pipeline.push(sortStage);

    // Lookup stage for owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
        }
    });

    // Unwind ownerDetails array
    pipeline.push({ $unwind: "$ownerDetails" });

    // Projection stage to shape the output
    pipeline.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            createdAt: 1,
            ownerDetails: {
                username: 1,
                avatar: "$ownerDetails.avatar"
            }
        }
    });

    // Pagination stage
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videoAggregate = Video.aggregate(pipeline);
    const video = await Video.aggregatePaginate(videoAggregate, options);
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!(title && description)) {
        throw new ApiError(400, "Title and description are required")
    }
    // if ([title, description].some((field) => field?.trim() === "")) {
    //     throw new ApiError(400, "All fields are required");
    // }

    // let videoFileLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     videoFileLocalPath = req.files.coverImage[0].path
    // }

    const videoFileLocalPath = req.files?.videoFile[0].path;

    const thumbnailLocalPath = req.files?.thumbnail[0].path;


    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);


    if (!(videoFile && thumbnail)) {
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,

        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user?._id,
        isPublished: true
    })

    const videoUpload = await Video.findById(video._id)

    if (!videoUpload) {
        throw new ApiError(500, "Failed to upload video")
    }


    return res.status(201).json(new ApiResponse(201, videoUpload, "Video uploaded successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // let userId = req.body;

    // userId = new mongoose.Types.ObjectId(userId)
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "videoFile.url": 1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
            }
        }
    ]);



    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        }
    });

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: videoId
        }
    });

    return res.status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    if (!(title && description)) {
        throw new ApiError(400, "Title and description are required")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }


    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }


    const thumbnailToDelte = video.thumbnail.public_id;
    const thumbnailLocalpath = req.file?.path;

    if (!thumbnailLocalpath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalpath)

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail")
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            thumbnail: {
                url: thumbnail.url,
                public_id: thumbnail.public_id
            }
        }
    },
        {
            new: true
        })


    if (!updateVideo) {
        throw new ApiError(500, "Failed to update video")
    }
    if (updateVideo) {
        await deleteOnCloudinary(thumbnailToDelte)
    }

    return res.status(200)
        .json(new ApiResponse(200, updateVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // if (video?.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to delete this video")
    // }

    const videoDelete = await Video.findByIdAndDelete(videoId)

    if (!videoDelete) {
        throw new ApiError(500, "Failed to delete video")
    }

    await deleteOnCloudinary(video.videoFile.public_id)
    await deleteOnCloudinary(video.thumbnail.public_id)


    await Like.deleteMany({ video: videoId })

    await Comment.deleteMany({ video: videoId })

    return res.status(200)
        .json(new ApiResponse(200, videoDelete, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // if (video.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(403, "You are not authorized to update this video")
    // }
    const newIsPublished = !(video && video.isPublished);
    const togglePubliish = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished: newIsPublished,
        }
    }, {
        new: true
    });

    if (!togglePubliish) {
        throw new ApiError(500, "Failed to update video")
    }

    return res.status(200)
        .json(new ApiResponse(200, togglePubliish, "Video updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}