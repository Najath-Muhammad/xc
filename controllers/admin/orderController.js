const Order = require("../../models/orderSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");
const User = require("../../models/userSchema");
const Address = require('../../models/addressSchema')
const mongoose = require('mongoose')

const orderInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    
    const orderData = await Order.find({})
      .populate('userId', 'name email')
      .populate('address','name addressType')
      .populate({
        path: 'orderedItems.product',
        select: 'name productId images'
      })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

      // console.log('order data',orderData)

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    const metrics = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    res.render("orders", {
      orders: orderData,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalOrders,
      metrics: metrics[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
    });
  } catch (error) {
    console.log("order controller error", error);
    res.redirect("/admin//pageError");
  }
};


const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('orderId:', orderId)
    
    const orderDetails = await Order.findOne({ orderId });

    if (!orderDetails) {
      return res.status(404).redirect('/admin/error');
    }

    const user = await User.findById(orderDetails.userId).select('name email phone');
    console.log('user:',user)
    const address = await Address.findById(orderDetails.address).select('address')
    console.log('address',address)
    const productsDetails = await Promise.all(
      orderDetails.orderedItems.map(async (item) => {
        const product = await Product.findById(item.product).select('name productId images price');
        return {
          ...item.toObject(),
          productDetails: product
        };
      })
    );
    console.log('productsDetails:',productsDetails);

    res.render("orderDetailsadm", {
      order: orderDetails,
      user: user,
      address: address,
      productsDetails: productsDetails
    });
  } catch (error) {
    console.log("get order details error", error);
    res.redirect("/admin/error");
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.session.user;
    const { orderId, status } = req.body;
    
    console.log("Incoming status update:", { userId, orderId, status });

    const validTransitions = {
      'Pending': ['Processing', 'Cancelled'],
      'Processing': ['Shipped', 'Cancelled'],
      'Shipped': ['Delivered'],
      'Delivered': ['Return Request'],
      'Return Request': ['Return Accepted', 'Return Cancelled'],
      'Return Accepted': ['Completed']
    };

    const order = await Order.findOne({ orderId });
    // console.log("Found order:", order);
    
    if (!order) {
      return res.status(404).json({ 
        status: false, 
        message: "Order not found" 
      });
    }
    
    if (!validTransitions[order.status]?.includes(status)) {
      console.log("Invalid transition attempt:", { 
        currentStatus: order.status, 
        attemptedStatus: status,
        allowedTransitions: validTransitions[order.status]
      });
      return res.status(400).json({
        status: false,
        message: "Invalid status transition"
      });
    }
    
    await Order.updateOne(
      { orderId: orderId },
      { 
        $set: { 
          status: status,
          ...(status === 'Shipped' && { invoiceDate: new Date() })
        }
      }
    );

    // If the status is 'Return Accepted' or 'Completed', credit the final amount to the user's wallet
    if (status === 'Return Accepted' || status === 'Completed') {
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({
          status: false,
          message: "Wallet not found"
        });
      }

      const finalAmount = order.finalAmount;

      wallet.balance += finalAmount;
      wallet.transactions.push({
        transactionType: 'Credit',
        amount: finalAmount,
        orderId: orderId,
        status: 'Success',
        remarks:"Return Refund"
      });

      await wallet.save();
    }

    if(status === "Delivered" || status === "Completed"){
      const order = await Order.findOneAndUpdate({orderId: orderId},{$set:{paymentStatus:"Completed"}});
    }

    res.json({ 
      status: true, 
      message: "Order status updated successfully" 
    });
  } catch (error) {
    console.log("update order status error", error);
    res.status(500).json({ 
      status: false, 
      message: "Internal server error" 
    });
  }
};
const getFilteredOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orderData = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('address')
      .populate({
        path: 'orderItems.product',
        select: 'name productId images'
      })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    const totalFilteredOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalFilteredOrders / limit);

    res.json({
      status: true,
      orders: orderData,
      currentPage: page,
      totalPages: totalPages,
      totalOrders: totalFilteredOrders
    });
  } catch (error) {
    console.log("filter orders error", error);
    res.status(500).json({ 
      status: false, 
      message: "Internal server error" 
    });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const salesData = await Order.aggregate([
      { $match: { 
        ...dateFilter,
        status: { $nin: ['Cancelled', 'Returned'] }
      }},
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdOn" 
            }
          },
          totalSales: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$finalAmount' },
          totalDiscount: { $sum: '$discount' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      status: true,
      salesData: salesData
    });
  } catch (error) {
    console.log("sales report error", error);
    res.status(500).json({ 
      status: false, 
      message: "Internal server error" 
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ 
        status: false, 
        message: "Order not found" 
      });
    }

    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        status: false,
        message: "Order cannot be cancelled at this stage"
      });
    }


    order.status = 'Cancelled';
    await order.save();

    res.json({
      status: true,
      message: "Order cancelled successfully"
    });
  } catch (error) {
    console.log("cancel order error", error);
    res.status(500).json({ 
      status: false, 
      message: "Internal server error" 
    });
  }
};

module.exports = {
  orderInfo,
  getOrderDetails,
  updateOrderStatus,
  getFilteredOrders,
  getSalesReport,
  cancelOrder,
  getOrderDetails
};