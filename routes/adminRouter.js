const express = require('express');
const app = express();
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const userController = require('../controllers/admin/usersController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const brandControllers = require('../controllers/admin/brandControllers')
const {isAuthenticated,isLogin} = require('../middlewares/adminAuth')
const multer = require('multer');
const storage = require('../helpers/multer')
const upload = multer({ storage: storage })



router.get('/pageError',adminController.pageError);
router.get('/login',isLogin,adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminController.loadDashboard);
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


module.exports = router;