const express = require('express');
const Cart = require('../../models/cartSchema'); 
const Product = require('../../models/productSchema');
const Coupon = require('../../models/couponSchema');


const loadCartPage = async (req, res) => {
  try {
      const userId = req.session.user;
      console.log('userId', userId);
      
      if (!userId) {
          return res.render('cart', { 
              cart: { items: [] }, 
              quantity: 0, 
              coupons: [], 
              user: null 
          });
      }

      const cart = await Cart.findOne({ userId: userId }).populate('items.productId');
      console.log('cart', cart);

      if (!cart) {
          return res.render('cart', { 
              cart: { items: [] }, 
              quantity: 0, 
              coupons: [], 
              user: userId 
          });
      }

      const productId = cart.items.map(item => item.productId._id);
      const products = await Product.find({ _id: { $in: productId } });

      const quantity = cart.items.reduce((total, item) => {
          const product = products.find(p => p._id.equals(item.productId._id));
          return total + (product ? item.quantity : 0);
      }, 0);

      const coupons = await Coupon.find();
      console.log('coupons:', coupons);

     
      res.render('cart', { 
          cart: cart, 
          quantity: quantity, 
          coupons: coupons,
          user: userId 
      });

  } catch (error) {
      console.log('Error loading cart page:', error);
      res.status(500).send('Internal Server Error');
  }
};


const addToCart = async (req, res) => {
    try {
      const { productId, price, quantity } = req.body;
      const userId = req.session.user;
      console.log('User ID:', userId);
      // console.log('Product ID:', productId);
      // console.log('Price:', price);
      // console.log('Quantity:', quantity);
  
      if (!price || isNaN(price)) {
        return res.status(400).json({ error: 'Price is required and must be a valid number.' });
      }
  
      if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number.' });
      }
  
      const totalPrice = price * quantity;
  
      const cart = await Cart.findOne({userId});
      // console.log('Cart Found:', cart);
  
      if (cart) {
        const existingItem = cart.items.find(item => item.productId.toString() === productId);
  
        if (existingItem) {
          existingItem.quantity += quantity;
          existingItem.totalPrice += totalPrice;
        } else {
          cart.items.push({ productId, price, quantity, totalPrice });
        }
  
        await cart.save();
        req.session.cart = cart
        console.log('Cart Updated:', cart);
        res.status(200).json({ message: 'Cart updated successfully', cart });
      } else {
        const newCart = new Cart({
          userId,
          items: [{ productId, price, quantity, totalPrice }],
        });
  
        await newCart.save();
        console.log('New Cart Created:', newCart);
        res.status(201).json({ message: 'Cart created successfully', cart: newCart });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while adding to the cart.' });
    }
  };


  const removeItemFromCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const itemId = req.body.itemId;

        const cart = await Cart.findOneAndUpdate(
            { userId: userId },
            { $pull: { items: { _id: itemId } } },
            { new: true }
        ).populate('items.productId');

        req.session.cart = cart
        res.json({ success: true, cart: cart });
    } catch (error) {
        console.log('Error removing item from cart:', error);
        res.json({ success: false, error: 'Failed to remove item' });
    }
}

const updateItemInCart = async (req, res) => {
  try {
      const userId = req.session.user;
      const { itemId, quantity } = req.body;

      // Find the cart
      const cart = await Cart.findOne({ userId }).populate('items.productId');

      if (!cart) {
          return res.redirect('/cart');
      }

      // Find the specific cart item
      const cartItem = cart.items.find(item => item._id.toString() === itemId);

      if (!cartItem) {
          return res.redirect('/cart');
      }

      // Check product stock and max quantity limit
      const product = await Product.findById(cartItem.productId);
      
      if (!product) {
          return res.redirect('/cart');
      }

      // Validate quantity against stock and max limit
      if (quantity > product.quantity || quantity > 10) {
          // Option to add flash message if you're using connect-flash
          // req.flash('error', 'Quantity exceeds available stock or maximum limit');
          return res.redirect('/cart');
      }

      // Update item quantity and total price
      cartItem.quantity = quantity;
      cartItem.totalPrice = cartItem.price * quantity;

      // Recalculate cart total
      cart.totalPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);

      // Save updated cart
      await cart.save();

      // Recalculate total quantity
      const productIds = cart.items.map(item => item.productId._id);
      const products = await Product.find({ _id: { $in: productIds } });
      const totalQuantity = cart.items.reduce((total, item) => {
          const product = products.find(p => p._id.equals(item.productId._id));
          return total + (product ? item.quantity : 0);
      }, 0);

      // Render cart page with updated data
      res.render('cart', { 
          cart: cart, 
          quantity: totalQuantity 
      });

  } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).render('page-404', { message: 'Internal server error' });
  }
};

  

module.exports = {loadCartPage,addToCart,removeItemFromCart,updateItemInCart}