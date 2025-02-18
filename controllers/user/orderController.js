const Order = require('../../models/orderSchema');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose'); 
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Coupon = require('../../models/couponSchema')
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();  



const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const loadOrderPlaced = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, finalAmount, coupon,paymentStatus } = req.body;
        console.log('body',req.body)
        console.log('cart',req.session.cart)
        if (!selectedAddress) {
            console.error('Missing selectedAddress in request body');
            return res.status(400).json({ error: 'Selected address is required' });
        }

        if (!paymentMethod) {
            console.error('Missing paymentMethod in request body');
            return res.status(400).json({ error: 'Payment method is required' });
        }

        let addressId;
        try {
            addressId = new mongoose.Types.ObjectId(selectedAddress.split('_')[0]);
        } catch (error) {
            console.error('Error parsing address ID:', error);
            return res.status(400).json({ error: 'Invalid address format' });
        }

        const userId = req.session.user;

        const address = await Address.findById(addressId);
        if (!address) {
            console.error('Address not found for ID:', addressId);
            return res.status(404).json({ error: 'Address not found' });
        }

        let couponApplied = false;

        if (coupon) {
            const couponDoc = await Coupon.findOneAndUpdate(
                { name: coupon },
                { $push: { userId: userId } }
            );

            if (couponDoc) {
                couponApplied = true;
            } else {
                console.error('Coupon not found:', coupon);
                return res.status(400).json({ error: 'Invalid coupon' });
            }
        }

        const cart = await Cart.findById(req.session.cart._id);
        if (!cart || !cart.items || cart.items.length === 0) {
            console.error('Cart is empty or not found');
            return res.status(400).json({ error: 'Cart is empty' });
        }

        let subtotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);

        const newOrder = new Order({
            userId: userId,
            orderedItems: cart.items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.totalPrice
            })),
            totalPrice: finalAmount,
            finalAmount: finalAmount,
            address: addressId,
            paymentMethod: paymentMethod,
            paymentStatus:paymentStatus,
            status: 'Pending',
            couponApplied: couponApplied,
            invoiceDate: new Date()
        });

        await newOrder.save();

        for (let item of cart.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity -= item.quantity;
                await product.save();
            }
        }

        await Cart.findByIdAndDelete(req.session.cart._id);
        req.session.cart = null;

        res.render('orderPlaced', {
            orderedItems: newOrder.orderedItems,
            selectedAddress: address,
            paymentMethod: paymentMethod,
            status: newOrder.status,
            finalAmount: newOrder.finalAmount,
            paymentStatus:newOrder.paymentStatus
        });

    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
const loadOrderDetails = async (req, res) => {
    try {
        console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);  // Ensure it's not undefined
console.log('Razorpay Key Secret:', process.env.RAZORPAY_KEY_SECRET);  // Ensure it's not undefined

        const order = await Order.findOne({ orderId: req.params.orderId })
            .populate('orderedItems.product')

        const addressObj = await Address.findById(order.address);
        const address = addressObj.address[0]
            
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        
        // console.log('address: ', address)
        res.render('order-details', { order,address });
    } catch (error) {
        res.status(500).render('page-404', { message: 'Server error' });
    }
}


const createOrder = async (req, res) => {
    console.log('body',req.body)
    const { amount, currency } = req.body; 

    try {
        const options = {
            amount: amount * 100, 
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`, 
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, orderId: order.id, amount: order.amount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const verifyPayment = (req, res) => {
    console.log('bodyv')
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET) // Use your Key Secret
        .update(body.toString())
        .digest('hex');

    if (expectedSignature === razorpay_signature) {
        res.status(200).json({ success: true, message: 'Payment verified!' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid signature!' });
    }
};

const generateInvoice = (order, res) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order.orderId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // ---------- HEADER ----------
    doc.fillColor('#000').fontSize(20).font('Helvetica-Bold').text('Beats', 50, 40);
    doc.fillColor('#000').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50);
    
    doc.fontSize(10).text(`Invoice #: ${order.orderId}`, 400, 80);
    doc.text(`Date: ${new Date(order.createdOn).toLocaleString()}`, 400, 105);
    doc.moveDown(2);

    // ---------- BILLING DETAILS ----------
    doc.fillColor('#444').fontSize(14).font('Helvetica-Bold').text('Bill To:', 50, doc.y);
    doc.fillColor('#000').fontSize(12).font('Helvetica');
    doc.text(`Name: ${order.userId.name}`, 50);
    doc.text(`Email: ${order.userId.email}`, 50);
    doc.text(`Phone: ${order.userId.phone}`, 50);
    doc.moveDown(1);

    // ---------- ORDER TABLE HEADER ----------
    const startX = 50, tableY = doc.y + 10;
    const columnWidths = [30, 200, 50, 50, 80, 80]; // Column spacing

    doc.fillColor('#fff').rect(startX, tableY, 500, 20).fill('#000'); // Header background
    doc.fillColor('#fff').fontSize(12).font('Helvetica-Bold');
    doc.text('No', startX + 5, tableY + 5);
    doc.text('Item Description', startX + columnWidths[0] + 5, tableY + 5);
    doc.text('Size', startX + columnWidths[0] + columnWidths[1] + 5, tableY + 5);
    doc.text('Qty', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, tableY + 5);
    doc.text('Price', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, tableY + 5);
    doc.text('Total', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 5, tableY + 5);
    doc.fillColor('#000');

    let rowY = tableY + 25;
    doc.fontSize(11).font('Helvetica');

    // Calculate subtotal while rendering items
    let subtotal = 0;
    order.orderedItems.forEach((item, index) => {
        // Calculate item total if not already calculated
        const itemTotal = item.totalPrice || (item.price * item.quantity);
        subtotal += itemTotal;

        // Alternating row color
        if (index % 2 === 0) {
            doc.fillColor('#f5f5f5').rect(startX, rowY, 500, 20).fill();
        }

        doc.fillColor('#000');
        doc.text(index + 1, startX + 5, rowY + 5);
        doc.text(item.product.productName || 'Product', startX + columnWidths[0] + 5, rowY + 5);
        doc.text(item.size, startX + columnWidths[0] + columnWidths[1] + 5, rowY + 5);
        doc.text(item.quantity.toString(), startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 5, rowY + 5);
        doc.text(`₹${item.price}`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 5, rowY + 5);
        doc.text(`₹${itemTotal}`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 5, rowY + 5);
        rowY += 20;
    });

    doc.moveTo(startX, rowY).lineTo(550, rowY).stroke(); // Bottom border

    // ---------- ORDER SUMMARY ----------
    // Calculate tax and final amount if not provided
    const discount = order.discount || 0;
    const tax = order.tax || (subtotal * 0.05); // 5% tax if not provided
    const finalAmount = order.finalAmount || (subtotal + tax - discount);

    rowY += 15;
    doc.fillColor('#222').fontSize(12).font('Helvetica-Bold');
    doc.text('Subtotal:', 400, rowY);
    doc.text('Tax (5%):', 400, rowY + 20);
    doc.text('Discount:', 400, rowY + 40);
    doc.text('Total Amount:', 400, rowY + 60);
    
    doc.fillColor('#000').fontSize(12).font('Helvetica');
    doc.text(`₹${subtotal.toFixed(2)}`, 480, rowY);
    doc.text(`₹${tax.toFixed(2)}`, 480, rowY + 20);
    doc.text(`₹${discount.toFixed(2)}`, 480, rowY + 40);
    doc.fontSize(14).font('Helvetica-Bold').text(`₹${finalAmount.toFixed(2)}`, 480, rowY + 60);

    doc.moveDown(2);

    // ---------- PAYMENT DETAILS ----------
    doc.fillColor('#444').fontSize(14).font('Helvetica-Bold').text('Payment Information:', 50);
    doc.fillColor('#000').fontSize(12).font('Helvetica');
    doc.text(`Payment Method: ${order.paymentMethod}`, 50);
    doc.text(`Payment Status: ${order.paymentStatus}`, 50);

    if (order.paymentMethod === 'COD') {
        doc.moveDown(1);
        doc.fillColor('red').font('Helvetica-Bold').text('Cash on Delivery - Please have the exact amount ready.', 50);
        doc.fillColor('#000');
    }

    doc.moveDown(1);

    // ---------- FOOTER ----------
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#444').font('Helvetica-Bold').text('Terms & Conditions:', 50);
    doc.fontSize(10).font('Helvetica').text('1. This is a system-generated invoice.', 50);
    doc.text('2. Goods once sold are non-refundable.', 50);
    doc.text('3. For support, contact our customer service.', 50);

    doc.moveDown(2);
    doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text('Thank you for shopping with us!', { align: 'center' });

    doc.end();
};

const downloadInvoice = async (req, res) => {
    try {
        console.log('body', req.params.orderId);
        const order = await Order.findOne({ orderId: req.params.orderId }).populate('userId orderedItems.product userId.addressId');
        console.log('order', order);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        generateInvoice(order, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        await Order.findOneAndUpdate(
            { orderId: orderId },
            { 
                $set: { 
                    paymentStatus: 'Completed',
                    status: 'Processing' 
                }
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};


module.exports = { loadOrderPlaced,
                    loadOrderDetails,
                    createOrder,
                    verifyPayment,
                    downloadInvoice,
                    updatePaymentStatus
                 };

