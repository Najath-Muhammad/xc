const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Coupon = require('../../models/couponSchema');
const User  = require('../../models/userSchema');


const validateStockInCheckout = async (userId) => {
  try {
    // Find user's cart and populate with product details
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !cart.items.length) {
      return { valid: false, message: 'Cart is empty', outOfStockItems: [] };
    }

    const outOfStockItems = [];
    

    for (const item of cart.items) {
      const product = item.productId;
      
      if (item.quantity > product.quantity) {
        outOfStockItems.push({
          productId: product._id,
          productName: product.productName,
          requestedQuantity: item.quantity,
          availableQuantity: product.quantity
        });
      }
    }
    
    if (outOfStockItems.length > 0) {
      return {
        valid: false,
        message: 'Some items in your cart are out of stock or have insufficient quantity',
        outOfStockItems
      };
    }
    
    return { valid: true };
    
  } catch (error) {
    console.error('Error validating stock:', error);
    return { valid: false, message: 'Error validating stock', error: error.message };
  }
};

const loadCheckout = async (req, res) => {
    try {
        const coupon = req.query.coupon || null;
        const discount = parseFloat(req.query.discount) || 0;
        const totalPrice = parseFloat(req.query.totalPrice) || 0;
        const userId = req.session.user;


        const stockValidation = await validateStockInCheckout(userId);
        if (!stockValidation.valid) {
            return res.redirect('/cart?stockError=true');
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        
        console.log('userId:', userId);
        const addresses = await Address.find({ userId });

        const subtotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const finalTotalPrice = subtotal - discount;

        req.session.cart = cart;

        res.render('checkout', {
            cart,
            addresses,
            subtotal,
            finalTotalPrice,
            coupon,
            discount,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone
            },
        });

    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).send(err.message);
    }
};
const validateStock = async (req, res) => {
    try {
        const userId = req.session.user;
        const validation = await validateStockInCheckout(userId);
        res.json(validation);
    } catch (error) {
        console.error('Stock validation API error:', error);
        res.status(500).json({ valid: false, message: 'Server error during stock validation' });
    }
}        
module.exports = { validateStockInCheckout, loadCheckout,validateStock };