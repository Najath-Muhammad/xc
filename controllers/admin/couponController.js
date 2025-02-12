const Coupon = require('../../models/couponSchema')

const couponInfo = async (req,res) => {
    try {
        
        const coupons = await Coupon.find()
        return res.render('coupon',{coupons})

    } catch (error) {
        res.redirect('/pageError')
    }
}

const createCoupon = async (req, res) => {
    try {
        const { couponName, startDate, endDate, offerPrice, minimumPrice } = req.body;

        if (!couponName || !startDate || !endDate || !offerPrice || !minimumPrice) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const normalizedCouponName = couponName.trim().toUpperCase();

        const existingCoupon = await Coupon.findOne({ 
            name: { $regex: new RegExp(`^${normalizedCouponName}$`, 'i') } 
        });
        
        if (existingCoupon) {
            return res.status(400).json({ 
                error: 'Coupon name already exists. Please use a different name.' 
            });
        }

        const parsedStartDate = new Date(startDate + "T00:00:00");
        const parsedEndDate = new Date(endDate + "T00:00:00");

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const parsedOfferPrice = parseFloat(offerPrice);
        const parsedMinimumPrice = parseFloat(minimumPrice);

        if (isNaN(parsedOfferPrice) || isNaN(parsedMinimumPrice)) {
            return res.status(400).json({ error: 'Invalid price values' });
        }

        const newCoupon = new Coupon({
            name: normalizedCouponName,
            createdOn: parsedStartDate,
            expireOn: parsedEndDate,
            offerPrice: parsedOfferPrice,
            minimumPrice: parsedMinimumPrice,
            isActive: true
        });

        const savedCoupon = await newCoupon.save();

        return res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            coupon: savedCoupon
        });

    } catch (error) {
        console.error('Error creating coupon:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                error: 'Coupon name already exists. Please use a different name.'
            });
        }
        return res.status(500).json({
            error: 'Failed to create coupon. Please try again.'
        });
    }
};
const getEditCoupon = async (req,res) => {
    try {
        
        const id = req.params.id;
        const coupon = await Coupon.findById(id);
        console.log('coupon',coupon.createdOn)
        res.render('editCoupon',{coupon})

    } catch (error) {
        console.log('error getting edit coupon:', error);   
    }
}

const updateCoupon =async (req, res) => {
    try {
        const { couponName, startDate, endDate, offerPrice, minimumPrice } = req.body;
        const coupon = await Coupon.findById(req.params.id);
        console.log('coupon',coupon)
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        coupon.name = couponName;
        coupon.startDate = new Date(startDate);
        coupon.endDate = new Date(endDate);
        coupon.offerPrice = offerPrice;
        coupon.minimumPrice = minimumPrice;

        await coupon.save();
        return res.json({ success: true, message: 'Coupon updated successfully'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        console.log('Coupon deleted:', deletedCoupon);

        return res.redirect('/admin/coupons');
    } catch (error) {
        console.error('Error deleting coupon:', error);
        return res.status(500).json({ 
            error: 'Failed to delete coupon',
            details: error.message 
        });
    }
};

module.exports = {couponInfo,createCoupon,updateCoupon,deleteCoupon,
                getEditCoupon }