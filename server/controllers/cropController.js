const Crop = require("../models/Crop");

// Create Crop (Admin Only)
exports.createCrop = async (req, res) => {
  try {
    const { name, description } = req.body;

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const crop = await Crop.create({
      name,
      description,
      image: imagePath,
      createdBy: req.user.id
    });

    res.status(201).json(crop);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Crops (Public)
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find().sort({ createdAt: -1 });
    res.json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Single Crop (Public)
exports.getSingleCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    res.json(crop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Crop (Admin Only)
exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    crop.name = req.body.name ?? crop.name;
    crop.description = req.body.description ?? crop.description;
    crop.image = req.body.image ?? crop.image;

    const updatedCrop = await crop.save();
    res.json(updatedCrop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Crop (Admin Only)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    await crop.deleteOne();

    res.json({ message: "Crop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};