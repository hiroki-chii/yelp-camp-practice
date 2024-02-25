const mongoose = require("mongoose");
const Review = require("./review");
const { string } = require("joi");
const { Schema } = mongoose;

const campgroundSchema = new Schema({
  title: String,
  images: [
    {
      url: String,
      filename: String,
    },
  ],
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
});

campgroundSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews,
      },
    });
  }
});

module.exports = mongoose.model("Campground", campgroundSchema);
