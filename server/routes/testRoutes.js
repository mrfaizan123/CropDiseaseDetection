const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

router.get("/protected", protect, (req, res) => {
  res.json({
    message: "Protected Route Working ✅",
    user: req.user,
  });
});

module.exports = router;