import mongoose , {Schema} from "mongoose";

const subcriptionSchema = new Schema({
    subscriber : {
        //one who subscribing the channel
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        //one who is being subscribed
        type: Schema.Types.ObjectId,
        ref: "User"
    }

} , {
    timestamps: true

})

export const Subscription = mongoose.model("Subscription" , subcriptionSchema)