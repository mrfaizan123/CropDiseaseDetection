// const mongoose = require("mongoose");

// const detectionSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true
//     },
//     crop: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Crop"
//     },
//     image: {
//       type: String,
//       required: true
//     },
//     result: {
//       type: String,
//       required: true
//     },
//     confidence: {
//       type: Number
//     }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Detection", detectionSchema);




import mongoose from 'mongoose';

const detectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  images: [{
    filename: String,
    originalName: String,
    size: Number,
    path: String
  }],
  results: [{
    className: String,
    confidence: Number,
    diseaseName: String,
    treatment: String,
    prevention: String,
    organicRemedy: String,
    isHealthy: Boolean
  }],
  overallResult: {
    type: String,
    enum: ['Healthy', 'Diseased'],
    default: 'Healthy'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

detectionSchema.index({ user: 1, createdAt: -1 });
detectionSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model('Detection', detectionSchema);