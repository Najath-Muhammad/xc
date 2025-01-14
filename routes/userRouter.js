const express = require('express');
const router = express.Router()
const userController = require('../controllers/user/userController');
const passport = require('passport');
const productController = require('../controllers/user/productController')
const profileController = require('../controllers/user/profileController')
const {userAuth,userLogin} = require('../middlewares/userAuth')


router.get('/pageNotfound',userLogin,userController.pageNotFound)

router.get('/',userController.loadHomepage);
router.get('/signup',userLogin,userController.loadSignup)
router.post('/signup',userLogin,userController.signUp);
router.post('/verify-otp',userLogin,userController.varifyOtp)
router.post('/resend-otp',userLogin,userController.resendOtp)

router.get('/auth/google',userLogin,passport.authenticate('google',{scope:['profile','email',]}));
router.get('/auth/google/callback',userLogin,passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
});
router.get('/login',userLogin,userController.loadLogin);
router.post('/login',userLogin,userController.login);

router.get('/logout',userController.logout);

router.get('/productDetails',productController.productDetails)

router.get('/profile',profileController.loadProfile)
router.post('/addresses', profileController.addAddress);





module.exports = router;