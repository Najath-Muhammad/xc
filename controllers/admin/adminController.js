const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Order = require('../../models/orderSchema');


const pageError = async (req,res)=>{
    res.render('pageError');
}




const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard');
    }
    return res.render('admin-login',{message:null});
}

const login = async (req,res)=>{
    try {
        
        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});

        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            }
            else{
                return res.render('admin-login',{message:'Invalid Password'});
            }
        }
        else{
        return res.render('admin-login',{message: 'Access Denied. Admin only.'})
        }

    } catch (error) {
        console.log('login error',error);
        return res.redirect('/pageError')
        
    }
}


const loadDashboard = async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    try {
        const admin = await User.findOne({ isAdmin: true });
        if (!admin) {
            return res.redirect('/admin/login');
        }

        const aggregationResult = await Order.aggregate([
            {
                $facet: {
                    totalOrders: [{ $count: "totalOrders" }],
                    totalDiscountPrice: [{ $group: { _id: null, totalDiscount: { $sum: "$discount" } } }],
                    discountGreaterThanZero: [
                        { $match: { discount: { $gt: 0 } } },
                        { $count: "totalDiscountCount" }
                    ],
                    totalQuantitySold: [
                        { $match: { status: "Delivered" } },
                        { $unwind: "$orderedItems" },
                        { $group: { _id: null, totalQuantity: { $sum: "$orderedItems.quantity" } } }
                    ]
                }
            },
            {
                $project: {
                    totalOrders: { $arrayElemAt: ["$totalOrders.totalOrders", 0] },
                    totalDiscountPrice: { $arrayElemAt: ["$totalDiscountPrice.totalDiscount", 0] },
                    totalDiscountCount: { $arrayElemAt: ["$discountGreaterThanZero.totalDiscountCount", 0] },
                    totalQuantitySold: { $arrayElemAt: ["$totalQuantitySold.totalQuantity", 0] }
                }
            }
        ]);

        const results = aggregationResult[0] || {};
        const totalOrders = results.totalOrders || 0;
        const totalDiscountPrice = results.totalDiscountPrice || 0;
        const totalDiscountCount = results.totalDiscountCount || 0;
        const totalQuantitySold = results.totalQuantitySold || 0;

        const mostSoldProduct = await Order.aggregate([
            { $match: { status: "Delivered" } },
            { $unwind: "$orderedItems" },
            { $group: { 
                _id: "$orderedItems.product",
                count: { $sum: "$orderedItems.quantity" } 
            }},
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' }
        ]);

        const bestSellingCategory = await Order.aggregate([
            { $match: { status: "Delivered" } },
            { $unwind: "$orderedItems" },
            { $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' },
            { $group: { 
                _id: "$productDetails.category", 
                count: { $sum: "$orderedItems.quantity" } 
            }},
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }},
            { $unwind: '$categoryDetails' }
        ]);

        const bestSellingBrand = await Order.aggregate([
            { $match: { status: "Delivered" } },
            { $unwind: "$orderedItems" },
            { $lookup: {
                from: 'products',
                localField: 'orderedItems.product',
                foreignField: '_id',
                as: 'productDetails'
            }},
            { $unwind: '$productDetails' },
            { $group: { 
                _id: "$productDetails.brand", 
                count: { $sum: "$orderedItems.quantity" } 
            }},
            { $sort: { count: -1 } }, 
            { $limit: 10 }, 
            { $lookup: {
                from: 'brands',
                localField: '_id', 
                foreignField: 'brandName',
                as: 'brandDetails'
            }},
            { $unwind: '$brandDetails' },
            { $project: {
                _id: "$brandDetails._id", 
                brandName: "$brandDetails.brandName",
                count: 1 
            }}
        ]);
        
        
        const countUser = await User.countDocuments();

        res.render('dashboard', {
            totalOrders,
            totalDiscountPrice,
            totalDiscountCount,
            totalSales: totalQuantitySold,
            totalUser: countUser,
            mostSoldProduct,
            bestSellingCategory,
            bestSellingBrand
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect("/admin/pageerror");
    }
};






const logout = async (req,res) => {
   try {

    req.session.destroy(err=>{
        if(err){
            console.log('error logging out',err);
            return res.redirect('/pageError')
        }
        return res.redirect('/admin/login')
    })

   } catch (error) {
    
    console.log("error occured while logging out",error);
    res.redirect('/pageError')
   }

}


module.exports = {
    loadLogin,login,loadDashboard,pageError,logout
}