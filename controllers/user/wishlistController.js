const User = require('../../models/userSchema');
const Product = require('../../models/productSchema')
const mongoose = require('mongoose');


const loadWishlist = async (req,res) => {
    try {
        const userId = req.session.user;
        const user  = await User.findById(userId) 
        const products = await Product.find({_id:{$in:user.wishlist}}).populate('category')
        res.render('wishlist',{user,wishlist:products})
    } catch (error) {
        console.log("error loading wishlist",error);
        res.redirect('/page-404');
    }
}

const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log('productId:',productId)
        const userId = req.session.user;
        console.log('userId',userId)
        const user = await User.findById(userId);
        console.log('user',user)
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        if (user.wishlist.includes(productId)) {
            return res.status(200).json({ status: false, message: "Product already in wishlist" });
        }

        user.wishlist.push(new mongoose.Types.ObjectId(productId));
        await user.save();

        return res.json({ status: true, message: 'Product added to wishlist' });
    } catch (error) {
        console.log('error adding to wishlist', error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};

const removeItemFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;
        console.log('productId:',productId)
        console.log('userId:',userId)

        if (!userId) {
            return res.status(401).json({ status: false, message: "User not authenticated" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const productIndex = user.wishlist.findIndex(id => id.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ status: false, message: "Product not found in wishlist" });
        }

        user.wishlist.splice(productIndex, 1);
        await user.save();

        return res.status(200).json({ status: true, message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing item from wishlist:', error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};
module.exports = {loadWishlist,addToWishlist,removeItemFromWishlist}