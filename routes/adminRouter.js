const express = require('express');
const app = express();
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/usersController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const brandControllers = require('../controllers/admin/brandControllers')
const orderController = require('../controllers/admin/orderController')
const couponController =  require('../controllers/admin/couponController')
const salesReportController = require('../controllers/admin/salesReportController')
const offerController = require('../controllers/admin/offerController')
const {isAuthenticated,isLogin} = require('../middlewares/adminAuth')
const multer = require('multer');
const storage = require('../helpers/multer')
const upload = multer({ storage: storage })



router.get('/error',adminController.pageError);
router.get('/login',isLogin,adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminController.loadDashboard)
router.get('/logout',adminController.logout);


// User management routes
router.get('/users',isAuthenticated,userController.userInfo);
router.get('/users/block/:id',isAuthenticated,userController.blockUser);
router.get('/users/unblock/:id',isAuthenticated,userController.unblockUser);
router.get('/users/delete/:id',isAuthenticated,userController.deleteUser);

// Category management routes
router.get('/category',isAuthenticated,categoryController.categoryInfo);
router.post('/addCategory',isAuthenticated,categoryController.addCategory);
router.post('/addCategoryOffer',isAuthenticated,categoryController.addCategoryOffer);
router.post('/removeCategoryOffer',isAuthenticated,categoryController.removeCategoryOffer);
router.post('/category/:categoryId/list',isAuthenticated,categoryController.getListCategory);
router.post('/category/:categoryId/unlist',isAuthenticated,categoryController.getUnListCategory);
router.get('/editCategory',isAuthenticated,categoryController.getEditCategory);
router.post('/editCategory/:id',isAuthenticated,categoryController.editCategory);
router.post('/applyCategoryOffer', isAuthenticated,categoryController.applyCategoryOffer);
router.post('/removeCategoryOffer', isAuthenticated,categoryController.removeCategoryOffer);

// Brand management routes
router.get('/brands',isAuthenticated,brandControllers.getBrandPage);
router.post('/addBrand',isAuthenticated,upload.single('image'), brandControllers.addBrand);
router.get('/blockBrand',isAuthenticated,brandControllers.blockBrand);
router.get('/unBlockBrand',isAuthenticated,brandControllers.unblockBrand);
router.get('/deleteBrand',isAuthenticated,brandControllers.deleteBrand);

// Product management routes
router.get('/addProducts',isAuthenticated,productController.getProductAddPage);
router.post('/addProducts',isAuthenticated,upload.array('images', 4), productController.addProducts);
router.get('/products',isAuthenticated,productController.getAllProducts);
router.get('/blockProducts',isAuthenticated,productController.blockProduct);
router.get('/unBlockProducts',isAuthenticated,productController.unBlockProduct);
router.get('/editProducts',isAuthenticated,productController.getEditProduct);
router.post('/editProducts/:id',isAuthenticated,upload.array('images',4),productController.editProducts)
router.post('/deleteImage',isAuthenticated,productController.deleteSingleImage)
router.post('/addProductOffer',isAuthenticated,productController.addProductOffer);
router.post('/removeProductOffer',isAuthenticated,productController.removeProductOffer);


//order management

router.get('/orders',isAuthenticated,orderController.orderInfo);
router.get('/order/:id',isAuthenticated,orderController.getOrderDetails);
router.post('/order/update-status',isAuthenticated,orderController. updateOrderStatus);
router.get('/orders/filter',isAuthenticated,orderController.getFilteredOrders);
// router.get('/orders/sales-report',isAuthenticated,orderController.getSalesReport);
router.post('/order/cancel',isAuthenticated,orderController. cancelOrder);
router.get('/order/:id', isAuthenticated, orderController.getOrderDetails);

//coupon management
router.get('/coupons',isAuthenticated,couponController.couponInfo);
router.post('/createCoupon',isAuthenticated,couponController.createCoupon)
router.get('/editCoupon/:id',isAuthenticated,couponController.getEditCoupon)
router.post('/updateCoupon/:id',isAuthenticated,couponController.updateCoupon)
router.get('/deleteCoupon/:id',isAuthenticated,couponController.deleteCoupon)

//offer management
router.get('/offers',isAuthenticated,offerController.loadOfferPage);
router.post('/offers/addNewOffer',isAuthenticated,offerController.createOffer);
router.get('/offers/deleteOffer/:id',isAuthenticated,offerController.deleteOffer);
router.get('/offers/editOffer/:id',isAuthenticated,offerController.editOffer);
router.post('/offers/updateOffer/:id',isAuthenticated,offerController.updateOffer);

//sales report
router.get('/salesReport',isAuthenticated,salesReportController.getSalesReport)
router.get('/sales-report/export',isAuthenticated,salesReportController.exportSalesReport)
router.get('/sales-data',isAuthenticated,salesReportController.getSalesData)
router.get('/generate-ledger',isAuthenticated,salesReportController.generateLedger)

module.exports = router;