// const jwt = require("jsonwebtoken");

// const protect = (req, res, next) => {
//   try {
//     let token;

//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer")
//     ) {
//       token = req.headers.authorization.split(" ")[1];

//       console.log("TOKEN:", token); // debug

//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       console.log("DECODED:", decoded); // debug

//       req.user = decoded;
//       next();
//     } else {
//       return res.status(401).json({ message: "No token" });
//     }
//   } catch (error) {
//     console.log("JWT ERROR:", error.message); // 🔥 IMPORTANT
//     return res.status(401).json({ message: "Not authorized, token failed" });
//   }
// };

// module.exports = protect;

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug log
    
    // Make sure we get the full user object with _id
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    req.user = user; // This sets the full user object with _id
    console.log("User set in request:", req.user._id); // Debug log
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route' 
    });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
};