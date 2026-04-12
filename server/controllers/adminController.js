import User from '../models/User.js';
import Detection from '../models/Detection.js';

export const getAdminAnalytics = async (req, res) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalDetections = await Detection.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayDetections = await Detection.countDocuments({
      createdAt: { $gte: today }
    });
    
    const diseaseStats = await Detection.aggregate([
      { $unwind: '$results' },
      { $group: {
        _id: '$results.className',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      success: true,
      analytics: {
        totalFarmers,
        totalDetections,
        todayDetections,
        topDiseases: diseaseStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin analytics'
    });
  }
};

export const getAllFarmers = async (req, res) => {
  try {
    const farmers = await User.find({ role: 'farmer' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: farmers.length,
      farmers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching farmers'
    });
  }
};