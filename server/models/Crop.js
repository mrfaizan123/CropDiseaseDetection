// const mongoose = require("mongoose");

// const cropSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     description: String,
//     image: String,
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Crop", cropSchema);



import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  scientificName: String,
  description: String,
  growingSeason: String,
  idealTemperature: String,
  waterRequirement: String,
  fertilizerNeeds: String,
  imageUrl: String
}, {
  timestamps: true
});

export default mongoose.model('Crop', cropSchema);