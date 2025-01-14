const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const Product =  require('../../models/productSchema');


const loadProfile = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            console.log('User ID is not defined in session.');
            return res.redirect('/login');
        }

        const userData = await User.findById(userId);
        const userAddresses = await Address.find({ userId: userId });

        res.render('profile', { user: userData, addresses: userAddresses });
    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound');
    }
};


const addAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        // console.log(userId)
        const {addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
        // console.log(req.body)
        userAddress = new Address({ userId:userId, address: [] });
        
        userAddress.address.push({
            addressType,
            name,
            city,
            landMark,
            state,
            pincode,
            phone,
            altPhone
        });
        await userAddress.save();
        // console.log(userAddress)
        res.status(201).json({ message: 'Address added successfully', address: userAddress });
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error: error.message });
    }
};

module.exports = { addAddress };




module.exports = {
    loadProfile,addAddress
}