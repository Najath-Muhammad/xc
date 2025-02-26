const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const passport = require('passport');
const productController = require('../controllers/user/productController');
const profileController = require('../controllers/user/profileController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController')
const orderController = require('../controllers/user/orderController')
const wishlistController = require('../controllers/user/wishlistController')


// const couponController = require('../controllers/user/couponController')
const walletController = require('../controllers/user/walletController')
const { userAuth, userLogin } = require('../middlewares/userAuth');

router.get('/pageNotfound', userController.pageNotFound);

router.get('/', userController.loadHomepage);
router.get('/signup', userLogin, userController.loadSignup);
router.post('/signup', userLogin, userController.signUp);
router.post('/verify-otp', userController.verifyOtp);
router.post('/resend-otp', userLogin, userController.resendOtp);

router.get('/auth/google', userLogin, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', userLogin, passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
    req.session.user = req.user;
    res.redirect('/');
});
router.get('/login', userLogin, userController.loadLogin);
router.post('/login', userLogin, userController.login);

router.get('/logout', userController.logout);

router.get('/forgotPassword',userController.loadForgotPasPage)
router.post('/sendOtp',userController.forgotEmailValid)
router.post('/verifyPassOtp',userController.verifyForgotPassOpt)
router.post('/resetPassword',userController.postNewPassword)
router.post('/sendOtpForEmailUpdate', userController.sendOtpForEmailUpdatePost);
router.get('/sendOtpForEmailUpdate', userController.sendOtpForEmailUpdateGet);
router.post('/emailUpdateOtp', userController.emailUpdateOtp);
router.post('/resendOtp',userController.resendOtpForEmailUpdate);

router.get('/products', userAuth,productController.loadProductsPage);
router.get('/productDetails', userAuth,productController.productDetails);
router.post('/applyFilters',userAuth,productController.applyFilters);

router.get('/profile', userAuth,profileController.loadProfile);
router.post('/updateName', userAuth,profileController.updateName);
router.post('/hhsendOtpForEmailUpdate', userAuth,profileController.sendOtpForEmailUpdate);
router.post('/fverifyEmailOtp', userAuth,profileController.verifyEmailOtp);
router.post('/updatePhone', userAuth,profileController.updatePhone);
router.post('/addresses', userAuth,profileController.addAddress);
router.post('/deleteAddress', userAuth,profileController.deleteAddress);
router.post('/editAddress', userAuth,profileController.editAddress);
router.get('/profile/:orderId', userAuth,orderController.loadOrderDetails)
router.post('/cancelOrderReason',userAuth,profileController.cancelOrderReason)
router.post('/cancelOrder',userAuth,profileController.cancelOrder)
router.post('/createOrder', userAuth,orderController.createOrder);
router.post('/returnRequestget',userAuth,profileController.returnRequestget)
router.post('/returnRequest',userAuth,profileController.submitReturnRequest)
router.post('/verifyPayment', userAuth,orderController.verifyPayment);
router.post('/updatePaymentStatus', userAuth,orderController.updatePaymentStatus);
router.get('/download-invoice/:orderId',userAuth,orderController.downloadInvoice)


router.post('/addToCart',userAuth,cartController.addToCart)
router.get('/cart', userAuth,cartController.loadCartPage);
router.post('/cart/removeItem',userAuth,cartController.removeItemFromCart)
router.post('/cart/updateItem', userAuth,cartController.updateItemInCart);

router.get('/checkout',userAuth,checkoutController.loadCheckout)
router.get('/validateStock',userAuth,checkoutController.validateStock)

router.post('/placeOrder',userAuth,orderController.loadOrderPlaced)

router.get('/wishlist',userAuth,wishlistController.loadWishlist)
router.post('/addToWishlist',userAuth,wishlistController.addToWishlist)
router.post('/wishlist/removeItem',userAuth,wishlistController.removeItemFromWishlist)

router.get('/wallet',userAuth,walletController.getWallet)
module.exports = router;