const Coupon = require('../../models/couponSchema');
const User = require('../../models/userSchema')


const applyCoupon = async (req, res) => {   
    try {
        const userId = req.session.user;
        const couponCode = req.body.coupon;
        console.log('dfa:',couponCode)

        const coupon = await Coupon.findOne({ couponCode: couponCode });
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        if (coupon.userId.includes(userId)) {
            return res.status(400).json({ success: false, message: "Only one Coupon can apply at a time" });
        }

        coupon.userId.push(userId);
        await coupon.save();

        const discount = coupon.offerPrice;

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            discount: discount,
            appliedCoupon: coupon,
        });
    } catch (error) {
        console.log("Error in applyCoupon", error);
        res.status(500).json({ status: false, message: "Internal Server Error" });
        
    }
}

module.exports = {
    applyCoupon
}