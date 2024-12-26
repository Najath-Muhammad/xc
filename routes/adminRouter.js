const express = require('express');
const app = express();
const router = express.Router();
const adminController = require('../controllers/admin/adminController');
const {adminAuth} = require('../middlewares/auth') 
const userController = require('../controllers/admin/usersController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController')
const brandControllers = require('../controllers/admin/brandControllers')
const multer = require('multer');
const storage = require('../helpers/multer')
const upload = multer({ storage: storage })



router.get('/pageError',adminAuth,adminController.pageError);
router.get('/login',adminController.loadLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminController.loadDashboard);
router.get('/logout',adminController.logout)

router.get('/users',userController.userInfo)
router.get('/users/block/:id',userController.blockUser)
router.get('/users/unblock/:id',userController.unblockUser)
router.get('/users/delete/:id', userController.deleteUser)

router.get('/category',categoryController.categoryInfo)
router.post('/addCategory',categoryController.addCategory)
router.post('/addCategoryOffer',categoryController.addCategoryOffer);
router.post('/removeCategoryOffer',categoryController.removeCategoryOffer)
router.post('/category/:categoryId/list',categoryController.getListCategory)
router.post('/category/:categoryId/unlist',categoryController.getUnListCategory)
router.get('/editCategory',categoryController.getEditCategory)
router.post('/editCategory/:id',categoryController.editCategory)


router.get('/brands',brandControllers.getBrandPage);
router.post('/addBrand',upload.single('image'),brandControllers.addBrand);
router.get('/blockBrand',brandControllers.blockBrand)
router.get('/unBlockBrand',brandControllers.unblockBrand)
router.get('/deleteBrand',brandControllers.deleteBrand)


// router.get('/addProducts',productController.getProductAddPage)

module.exports = router;