const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const OTP = require("../../controllers/user/userController");
const Cart = require("../../models/cartSchema")
const Order = require("../../models/orderSchema")
const Product = require("../../models/productSchema")
const Wallet = require('../../models/walletSchema')
const Razorpay = require('razorpay')
const mongoose = require("mongoose");


const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        console.log('Session user ID:', userId);

        if (!userId) {
            console.log('User session not found or user ID missing');
            return res.redirect('/login');
        }

        const userData = await User.findById(userId);
        console.log('UserData:', userData);

        const userAddressesDocs = await Address.find({ userId: userId });
        const userCart = await Cart.findOne({ userId: userId });
        const userOrders = await Order.find({ userId: userId })
            .sort({ createdOn: -1 })
            .populate('orderedItems.product');

        const addresses = userAddressesDocs.reduce((acc, doc) => {
            return acc.concat(doc.address);
        }, []);

        res.render('profile', { user: userData, addresses: addresses, cart: userCart, orders: userOrders });
    } catch (error) {
        console.error('Error loading profile:', error);
        res.redirect('/pageNotFound');
    }
};

const updateName = async (req, res) => {
    try {
        const userId = req.session.user;
        const { fullname } = req.body;

        await User.findByIdAndUpdate(userId, { fullname });

        res.redirect('/profile');
    } catch (error) {
        console.log('Error updating name:', error);
        res.redirect('/pageNotFound');
    }
};

const sendOtpForEmailUpdate = async (req, res) => {
    try {
        // console.log('Received email update request');
        // console.log('Request body:', req.body);
        // console.log('Session:', req.session);
  
        const user = req.session.user;
        if (!user || !user._id) {
            console.error('User not logged in or session expired');
            return res.status(401).json({ 
                success: false, 
                message: 'User not logged in or session expired' 
            });
        }
  
        const userId = user._id;
        const { email } = req.body;
  
        if (!email) {
            console.error('No email provided');
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
  
        // console.log(`Sending OTP to update email for userId: ${userId}, new email: ${email}`);
  
        const otp = await OTP.generateOtp();
        const emailSent = await OTP.sendVerification(email, otp);
        if (!emailSent) {
            console.error('Failed to send verification email');
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending email' 
            });
        }
  
        req.session.otp = otp;
        req.session.newEmail = email;
  
        console.log(`OTP for changing the email is ${otp}`);
        // console.log('Session Data after setting OTP:', req.session);
  
        res.render('varifyOtp')
    } catch (error) {
        console.error('Detailed Backend Error:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
    
        res.status(500).render('page-404', { 
            message: 'An unexpected error occurred',
            errorDetails: error.message
        });
    }
  };

const verifyEmailOtp = async (req, res) => {
  try {
      const user = req.session.user;
      if (!user || !user._id) {
          console.log('User not logged in or session expired');
          return res.redirect('/login');
      }

      const { otp } = req.body;
      const newEmail = req.session.newEmail;
      const storedOtp = req.session.otp;

      console.log(`Verifying OTP: received ${otp}, expected ${storedOtp}`);
      console.log('Session Data during OTP verification:', req.session);

      if (otp === storedOtp) {
          await User.findByIdAndUpdate(user._id, { email: newEmail });
          req.session.otp = null; 
          req.session.newEmail = null;
          res.redirect('/profile');
      } else {
          res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
  } catch (error) {
      console.log('Error verifying OTP for email update:', error);
      res.status(500).json({ success: false, message: 'Internal Server error' });
  }
};


const updatePhone = async (req, res) => {
    try {
        const userId = req.session.user;
        const { phone } = req.body;


        await User.findByIdAndUpdate(userId, { phone });

        res.redirect('/profile');
    } catch (error) {
        console.log('Error updating phone:', error);
        res.redirect('/pageNotFound');
    }
};


const addAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressType, name, streetAddress, city, landMark, state, pincode, phone, altPhone } = req.body;

        const userAddress = new Address({ userId: userId, address: [] });

        userAddress.address.push({
            addressType,
            name,
            streetAddress,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        });

        await userAddress.save();
        res.redirect('/profile')
        // res.status(201).json({ message: 'Address added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error: error.message });
    }
};


const deleteAddress = async (req, res) => {
    try {
        const addressId = req.body.id;
        const findAddress = await Address.findOne({ 'address._id': addressId });

        if (!findAddress) {
            return res.status(404).send('Address not found');
        }

        await Address.updateOne(
            { 'address._id': addressId },
            { $pull: { address: { _id: addressId } } }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error('Error in deleting address:', error);
        res.redirect('/pageNotFound');
    }
};


const editAddress = async (req, res) => {
    try {
        const { id, addressType, name, streetAddress, city, landMark, state, pincode, phone, altPhone } = req.body;
        const addressId = id;

        const findAddress = await Address.findOne({ 'address._id': addressId });

        if (!findAddress) {
            return res.redirect('/pageNotFound');
        }

        await Address.updateOne(
            { 'address._id': addressId },
            {
                $set: {
                    'address.$': {
                        _id: addressId,
                        addressType,
                        name,
                        streetAddress,
                        city,
                        landMark,
                        state,
                        pincode,
                        phone,
                        altPhone
                    }
                }
            }
        );

        res.redirect('/profile');
    } catch (error) {
        console.error('Error in editing address:', error);
        res.redirect('/pageNotFound');
    }
};

const cancelOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const orderId = req.body.orderId;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Order ID format',
            });
        }

        const findOrder = await Order.findOne({ orderId }); 

        if (!findOrder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        const nonCancellableStates = ['Delivered', 'Cancelled', 'Returned'];
        if (nonCancellableStates.includes(findOrder.status)) {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${findOrder.status.toLowerCase()}`
            });
        }

        const canceledQuantity = findOrder.orderedItems[0].quantity;
        const productId = findOrder.orderedItems[0].product;
        console.log('productId', productId);

        await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: canceledQuantity }},
            { new: true }
        );

        await Order.updateOne(
            { orderId }, 
            { 
                $set: {
                    status: 'Cancelled',
                    cancelledAt: new Date(),
                    cancellationReason: 'Cancelled by user',
                    paymentStatus:"Failed"
                }
            }
        );

        if (findOrder.paymentMethod === 'razorpay') {
            const refundAmount = findOrder.finalAmount;

            const wallet = await Wallet.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId)}, 
                {
                    $inc: { balance: refundAmount },
                    $push: {
                        transactions: {
                            transactionType: "Credit",
                            amount: refundAmount,
                            status: "Success",
                            date: new Date(),
                            orderId: orderId,
                            remarks:"Canceled Order" 
                        },
                    },
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                    runValidators: true,
                }
            );

            console.log('Wallet updated:', wallet);
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the order',
            error: error.message, 
        });
    }
};
const returnRequestget = async (req,res) => {
    try {
        
        const userId = req.session.user;
        const orderId = req.body.orderId;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Order ID format',
            });
        }

        const order = await Order.findOne({ orderId }); 
        res.render('return-req',{order})


    } catch (error) {
        console.log('error loading page',error)
    }
}

const submitReturnRequest = async (req, res) => {
    try {
        const userId = req.session.user; 
        const { orderId, returnReason } = req.body; 

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required',
            });
        }

        if (!returnReason) {
            return res.status(400).json({
                success: false,
                message: 'Return reason is required',
            });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(orderId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Order ID format',
            });
        }

        const findOrder = await Order.findOne({ orderId }); // Use a query object with orderId

        if (!findOrder) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (findOrder.status !== 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'Only delivered orders can be returned'
            });
        }

        await Order.updateOne(
            { orderId }, 
            { 
                $set: {
                    status: 'Return Request',
                    returnReason: returnReason,
                    returnRequestedAt: new Date()
                }
            }
        );

        res.redirect('/profile')
        // res.status(200).json({
        //     success: true,
        //     message: 'Return request submitted successfully',
        // });
    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while submitting the return request',
            error: error.message, 
        });
    }
};
module.exports = {
    loadProfile,
    updateName,
    sendOtpForEmailUpdate,
    verifyEmailOtp,
    updatePhone,
    addAddress,
    deleteAddress,
    editAddress,
    cancelOrder,
    returnRequestget,
    submitReturnRequest
};