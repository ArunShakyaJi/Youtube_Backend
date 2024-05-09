import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const likeAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user.id
    })

    if(likeAlready){
        await Like.findByIdAndDelete(likeAlready?._id)

        return res.status(200)
                .json(new ApiResponse(200, { isLiked: false }))
    }


    await Like.create(
        {
            video: videoId,
            likedBy: req.user.id
        }
    )

    return res.status(200)
                .json(new ApiResponse(200, { isLiked: true }))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    
    })

    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res.status(200)
                .json(new ApiResponse(200, { isLiked: false }))
    
    }

    await Like.create ({
        comment: commentId,
        likedBy: req.user._id
    })

    return res.status(200)
                .json(new ApiResponse(200, { isLiked: true }))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    // Find if the tweet has already been liked by the user
    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (likedAlready) {
        // If the tweet has already been liked, remove the like
        await Like.findByIdAndDelete(likedAlready._id);

        return res.status(200).json(new ApiResponse(200, { isLiked: false }));
    } else {
        // If the tweet has not been liked, add a new like
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });

        return res.status(200).json(new ApiResponse(200, { isLiked: true }));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideosAggegate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        },
    ]);

    // console.log("likedVideosAggegate", likedVideosAggegate);
    return res.status(200)
                .json(new ApiResponse(200, likedVideosAggegate , "Liked Videos fetched successfully"))

})
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}