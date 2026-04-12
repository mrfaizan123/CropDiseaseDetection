import mongoose from 'mongoose';

const fertilizerShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: String,
  phone: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  rating: {
    type: Number,
    default: 0
  },
  products: [String]
});

fertilizerShopSchema.index({ location: '2dsphere' });

export default mongoose.model('FertilizerShop', fertilizerShopSchema);