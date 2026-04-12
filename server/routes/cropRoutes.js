const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const {
  createCrop,
  getAllCrops,
} = require("../controllers/cropController");

// DEBUG
console.log("protect:", typeof protect);
console.log("adminOnly:", typeof adminOnly);
console.log("createCrop:", typeof createCrop);

// Create crop (Admin only)
router.post("/", protect, adminOnly, upload.single("image"), createCrop);

// Get all crops
router.get("/", getAllCrops);

module.exports = router;