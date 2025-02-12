const mongoose = require('mongoose');
const { Schema } = mongoose;

const OfferSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now,
    required: true                       
    
  },
  expiring: {
    type: Date,
    required: true
  },
  discount: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
}]
});

const Offer = mongoose.model('Offer', OfferSchema);
module.exports = Offer;