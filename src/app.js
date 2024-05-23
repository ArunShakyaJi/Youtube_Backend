import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true , limit: '50mb'}));
app.use(express.static('public'));

app.use(cookieParser());

//routes

import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.router.js';
import tweetRoutes from "./routes/tweet.routes.js";
import likeRoutes from "./routes/likes.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import healthRoutes from "./routes/healthCheck.rotes.js";
import dashboardRouter from "./routes/dashborad.routes.js";
// routes declaration 

console.log("hello");
app.use("/api/v1/users/" , userRoutes);
app.use("/api/v1/videos/" , videoRoutes);
app.use("/api/v1/tweets/" , tweetRoutes);
app.use("/api/v1/likes/" , likeRoutes);
app.use("/api/v1/comment/" , commentRoutes);
app.use("/api/v1/subscriptions/", subscriptionRouter);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/healthcheck", healthRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/dashboard", dashboardRouter);

export default app;