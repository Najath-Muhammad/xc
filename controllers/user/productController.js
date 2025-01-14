const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');


const productDetails = async (req,res) => {
    try {
        
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer;
        const totalOffer = categoryOffer+productOffer;
        const products = await Product.find({
            _id:{$ne:product._id},
            isBlocked:false,
            category:findCategory
        })
        products.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt))
        products.slice(0,4)
        res.render('product-details',{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
            products:products 
        })

    } catch (error) {
        console.log('error in fetching details',error)
        res.redirect('/pageNotFound')
    }
}

module.exports = {productDetails}