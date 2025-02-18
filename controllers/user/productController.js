const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');
const Brand = require('../../models/brandSchema');

const loadProductsPage = async (req, res) => {
    try {
        const userId = req.session.user;
        console.log('userId:', userId)

        const user = await User.findById(userId)


        const products = await Product.find({
            isBlocked: false,
            quantity: { $gt: 0 }
        }).populate('category').populate('brand').sort({ createdAt: -1 });


        const categories = await Category.find({ isListed: true });
        const brands = await Brand.find({ isBlocked: false });
        if (!user.wishlist) {
            user.wishlist = []
        }
        const wishlist = user.wishlist || []
        console.log('wishlist', wishlist)

        res.render('shoping', { products, categories, brands, wishlist });

    } catch (error) {
        console.error('Error loading the shopping page:', error);
        res.status(500).render('page-404', { message: 'Error loading products' });
    }
};

const applyFilters = async (req, res) => {
    try {
        const { categories, brands, sortBy, search } = req.body;
        const userId = req.session.user;

        let query = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        // Add search query
        if (search) {
            query.productName = { $regex: search, $options: 'i' };
        }

        if (categories?.length > 0) {
            query.category = { $in: categories };
        }

        if (brands?.length > 0) {
            query.brand = { $in: brands };
        }

        const sortConfig = {
            'low-to-high': { salePrice: 1 },
            'high-to-low': { salePrice: -1 },
            'new-arrivals': { createdAt: -1 },
            'a-to-z': { productName: 1 },
            'z-to-a': { productName: -1 }
        }[sortBy] || { createdAt: -1 };

        // Get user's wishlist
        const user = await User.findById(userId);
        const wishlist = user ? user.wishlist.map(id => id.toString()) : [];

        const products = await Product.find(query)
            .populate('category')
            .populate('brand')
            .sort(sortConfig)
            .lean();

        const productsWithWishlist = products.map(product => ({
            ...product,
            isWishlisted: wishlist.includes(product._id.toString())
        }));

        res.json({ success: true, products: productsWithWishlist });

    } catch (error) {
        console.error('Error in applyFilters:', error);
        res.status(500).json({
            success: false,
            message: 'Error filtering products'
        });
    }
};

const productDetails = async (req, res) => {
    try {

        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category
        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer;
        const totalOffer = categoryOffer || productOffer;
        const products = await Product.find({
            _id: { $ne: product._id },
            isBlocked: false,
            category: findCategory
        })
        console.log(product.quantity)
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        products.slice(0, 4)
        res.render('product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            products: products
        })

    } catch (error) {
        console.log('error in fetching details', error)
        res.redirect('/pageNotFound')
    }
}


module.exports = { productDetails, loadProductsPage, applyFilters }