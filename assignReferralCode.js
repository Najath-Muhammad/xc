const mongoose = require('mongoose');
const connectDB = require('./config/db'); // Adjust the path to your db connection file
const User = require('./models/userSchema'); // Adjust the path to your user model
const { v4: uuidv4 } = require('uuid');

// Function to generate a 10-character referral code
const generateReferralCode = () => {
    return uuidv4().replace(/-/g, '').substring(0, 10); // Remove hyphens and take the first 10 characters
};

const assignReferralCodes = async () => {
    try {
        // Connect to the database
        await connectDB();

        const usersWithoutReferralCode = await User.find({ $or: [{ referralCode: { $exists: false } }, { referralCode: null }] });

        for (const user of usersWithoutReferralCode) {
            user.referralCode = generateReferralCode();
            await user.save();
        }

        console.log(`Assigned referral codes to ${usersWithoutReferralCode.length} users.`);
    } catch (error) {
        console.error('Error assigning referral codes:', error);
    } finally {
        mongoose.connection.close();
    }
};

assignReferralCodes();