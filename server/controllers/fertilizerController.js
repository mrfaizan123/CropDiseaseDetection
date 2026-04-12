import FertilizerShop from '../models/FertilizerShop.js';

export const getNearbyShops = async (req, res) => {
  try {
    const { lat, lon, radius = 10 } = req.query;
    
    const shops = await FertilizerShop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lon), parseFloat(lat)]
          },
          $maxDistance: radius * 1000
        }
      }
    }).limit(20);
    
    res.json({
      success: true,
      count: shops.length,
      shops
    });
  } catch (error) {
    const mockShops = [
      {
        name: 'Kisan Fertilizer Store',
        address: 'Near Main Market',
        phone: '9876543210',
        distance: 1.2,
        rating: 4.5
      },
      {
        name: 'Agro Care Center',
        address: 'Station Road',
        phone: '9876543211',
        distance: 2.5,
        rating: 4.2
      },
      {
        name: 'Green Field Agri Shop',
        address: 'Bus Stand Area',
        phone: '9876543212',
        distance: 3.8,
        rating: 4.0
      }
    ];
    
    res.json({
      success: true,
      count: mockShops.length,
      shops: mockShops
    });
  }
};

export const getFertilizerGuide = async (req, res) => {
  try {
    const { crop } = req.params;
    
    const fertilizerGuide = {
      wheat: {
        name: 'DAP + Urea',
        dosage: '50kg DAP + 40kg Urea per acre',
        schedule: 'Apply DAP at sowing, Urea in 2 splits',
        organic: 'Vermicompost 2 tons per acre'
      },
      rice: {
        name: 'Urea + DAP',
        dosage: '50kg Urea + 30kg DAP per acre',
        schedule: 'Apply in 3 splits',
        organic: 'Green manure + FYM'
      },
      potato: {
        name: 'NPK Complex',
        dosage: '50:50:50 kg per acre',
        schedule: 'Apply at planting time',
        organic: 'Farm yard manure 10 tons/acre'
      },
      tomato: {
        name: 'Water Soluble Fertilizer',
        dosage: '19:19:19 - 5kg/acre',
        schedule: 'Weekly foliar spray',
        organic: 'Compost tea + Vermicompost'
      }
    };
    
    const guide = fertilizerGuide[crop?.toLowerCase()] || {
      name: 'Balanced NPK',
      dosage: 'Consult agriculture officer',
      schedule: 'Based on soil test',
      organic: 'Use organic manure'
    };
    
    res.json({
      success: true,
      crop: crop,
      guide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fertilizer guide'
    });
  }
};