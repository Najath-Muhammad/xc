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

router.get('/pageNotfound', userLogin, userController.pageNotFound);

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

router.get('/products', productController.loadProductsPage);
router.get('/productDetails', productController.productDetails);
router.post('/applyFilters',productController.applyFilters);

router.get('/profile', profileController.loadProfile);
router.post('/updateName', profileController.updateName);
router.post('/hhsendOtpForEmailUpdate', profileController.sendOtpForEmailUpdate);
router.post('/fverifyEmailOtp', profileController.verifyEmailOtp);
router.post('/updatePhone', profileController.updatePhone);
router.post('/addresses', profileController.addAddress);
router.post('/deleteAddress', profileController.deleteAddress);
router.post('/editAddress', profileController.editAddress);
router.get('/profile/:orderId', orderController.loadOrderDetails)
router.post('/cancelOrderReason',profileController.cancelOrderReason)
router.post('/cancelOrder',profileController.cancelOrder)
router.post('/createOrder', orderController.createOrder);
router.post('/returnRequestget',profileController.returnRequestget)
router.post('/returnRequest',profileController.submitReturnRequest)
router.post('/verifyPayment', orderController.verifyPayment);
router.post('/updatePaymentStatus', orderController.updatePaymentStatus);
router.get('/download-invoice/:orderId',orderController.downloadInvoice)


router.post('/addToCart',cartController.addToCart)
router.get('/cart', cartController.loadCartPage);
router.post('/cart/removeItem',cartController.removeItemFromCart)
router.post('/cart/updateItem', cartController.updateItemInCart);

router.get('/checkout',checkoutController.loadCheckout)

router.post('/placeOrder',orderController.loadOrderPlaced)

router.get('/wishlist',wishlistController.loadWishlist)
router.post('/addToWishlist',wishlistController.addToWishlist)
router.post('/wishlist/removeItem',wishlistController.removeItemFromWishlist)

router.get('/wallet',walletController.getWallet)
module.exports = router;