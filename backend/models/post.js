const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imagePath: { type: String},
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User"}
});

module.exports = mongoose.model("Post", postSchema);
