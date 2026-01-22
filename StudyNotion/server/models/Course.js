const mongoose = require("mongoose")

const courseSchema = mongoose.Schema({

    courseName: {
        type: String,
        required: true,
    },
    couseDescription: {
        type: String,
        trim: true,
        
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    whatYouWillLearn: {
        type: String,
    },
     courseContent : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Section",

        }

     ],
     ratingAndReviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RatingAndReview"
        }
     ],
     price: {
        type: Number
     },
     thumbnail: {
        type: String
     },
     tag : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag"
     },
     studentsEnrolled : [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
     }
     ],
})


module.Exports = mongoose.model("Course" , courseSchema)