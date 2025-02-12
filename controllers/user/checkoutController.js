const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Coupon = require('../../models/couponSchema');
const User  = require('../../models/userSchema');


const loadCheckout = async (req, res) => {
    try {
        const coupon = req.query.coupon || null;
        const discount = parseFloat(req.query.discount) || 0;
        const totalPrice = parseFloat(req.query.totalPrice) || 0;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        console.log('userId:',userId)
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
module.exports = { loadCheckout };