const User = require('../../models/userSchema');
const Category =  require('../../models/categorySchema');
const Product =  require('../../models/productSchema');
const Wallet = require('../../models/walletSchema');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');




const pageNotFound =async (req,res) => {
    try{
        res.render('page-404')
    }
    catch(error){
        res.redirect('/pageNotFound'); 
    }
}




const loadHomepage = async (req, res) => {
    try {
        // console.log(req.session)
        // const user1 = User.find({referalCode:'809ed066ce'})
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        let products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            quantity: { $gt: 0 }
        });
        // console.log(user)
        // console.log('cart:',req.session.cart)
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        products = products.slice(0, 4);
        // console.log(products);
        if (user) {
            const userData = await User.findOne({ _id: user });
           // console.log('userData:',userData)
            res.render('home', { user: userData, products: products });
        } else {
            res.render('home', { products: products });
        }
    } catch (error) {
        console.error('Error loading homepage:', error);
        res.status(500).send('Server error');
    }
};

const loadSignup = async (req,res)=>{
    try{
        return res.render('signup');
    }
    catch(error){
        console.log('sign up page not loading:',error);
        res.status(500).send('Server Error');
    }
}


function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}


async function sendVerification(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            },
        });
        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify your email',
            text:`Your OTP is ${otp}`,
            html:`<b>Your OTP: ${otp}</b>`
        })
        return info.accepted.length > 0;
    } catch (error) {
        console.log("Error sending OTP",error);
        return false;
    }
}

  
const signUp = async (req, res) => {
    console.log('body', req.body);
    const { fullname, email, phone, password, referralCode } = req.body;

    try {
        const newUser = new User({ fullname, email, phone, password });
        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render('signup', { message: "Email already exists" });
        }

        const otp = generateOtp();
        const emailSent = await sendVerification(email, otp);
        // if (!emailSent) {
        //     return res.json("Email error");
        // } else {

            req.session.referralCode = referralCode;
            req.session.userOtp = otp;
            req.session.user = { fullname, email, phone, password };

            console.log("OTP sent", otp);
            return res.render('verify-otp');
        // }

    } catch (error) {
        console.log('Error in Sign-Up', error);
        res.redirect("/pageNotFound");
    }
};


const securePassword = async (password)=>{
  try {
    const passworHash = await bcrypt.hash(password,10)
    return passworHash;
  } catch (error) {
    console.log('Error hashing password:', error);
    throw new Error('Error hashing password');
  }
}


const varifyOtp = async (req, res) => {
    console.log('haaaaaaaaai');
    try {
        const { otp } = req.body;
        console.log('Received OTP:', otp);
        console.log('Session OTP:', req.session.userOtp);

        if (otp === req.session.userOtp) {
            const user = req.session.user;
            if (!user) {
                return res.status(400).json({ success: false, message: 'User session not found' });
            }

            const passwordHash = await securePassword(user.password);

            const saveUserData = new User({
                fullname: user.fullname,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            });

            await saveUserData.save();

            const referralCode = req.session.referralCode; // Correct the spelling here
            console.log('referral code', referralCode);
            if (referralCode) {
                const referrer = await User.findOne({ referralCode: referralCode });
                if (referrer) {
                    const wallet = await Wallet.findOneAndUpdate(
                        { userId: referrer._id },
                        {
                            $inc: { balance: 50 },
                            $push: {
                                transactions: {
                                    transactionType: "Credit",
                                    amount: 50,
                                    status: "Success",
                                    date: new Date(),
                                    orderId: null,
                                    remarks: 'Referral Bonus'
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
                } else {
                    console.log('Invalid referral code');
                }
            }

            req.session.user = saveUserData._id;
            req.session.userOtp = null;

            res.json({ success: true, redirectUrl: '/' }); // Return redirect URL
        } else {
            res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error Verifying OTP', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const resendOtp = async (req, res) => {
    try {
        if (!req.session.userData) {
            res.status(400).json({ success: false, message: 'No user session found' });
            return;
        }

        
        const newOtp = generateOtp();
        req.session.userOtp = newOtp;

        console.log(`Generated OTP: ${newOtp}`);
        
        const user = req.session.userData;
        const emailSent = await sendVerification(user.email, newOtp);

        if (emailSent) {
            res.json({ success: true, message: 'OTP resent successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send OTP' });
        }
    } catch (error) {
        console.error('Error Resending OTP', error);
        res.status(500).json({ success: false, message: 'Internal Server error' });
    }
};

const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login');
        }
        else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}

const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        const findUser = await User.findOne({isAdmin:0,email:email});

        if(!findUser){
            return res.render('login',{message:'User not Found'});
        }
        if(findUser.isBlocked){
            return res.render('login',{message:'Your account is blocked'})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password); 

        if(!passwordMatch){
            return res.render('login',{message:'Invalid Password'});
        }

        req.session.user = findUser._id;
        res.redirect('/')

    } catch (error) {
        console.log('login error');
        res.render('login',{message:"login failed, Please try again"})
    }
}

const logout = async (req,res)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err){
                console.log('session destruction error',err.message);
                return res.redirect('/pageNotFound')
            }
            return res.redirect('/')
        })

    } catch (error) {
    
        console.log('logout error',error);
        res.redirect('/pageNotFound')
        
    }

}

const loadForgotPasPage = async (req,res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        res.redirect('/pageNotFound')
        console.log("error loading page",error)
    }
}

const forgotEmailValid = async (req,res)=>{
    try {
  
      const {email} = req.body
      console.log('des',email)
      const findUser = await User.findOne({email:email})
      if(findUser){
        const otp = generateOtp();
        const emailSent = await sendVerification(email,otp)
        if(emailSent){
          req.session.userOtp = otp
          req.session.email = email
          res.render('forgotPassOtp')
          console.log('OTP:',otp)
        }else{
          res.json({success:false,message:"Failed to send OTP, Please try again"})
        }
      }else{
        res.render("forgotPassOtp",{
          message:"User with this email does not exist"
        })
      }
      
    } catch (error) {
      res.redirect('/pageNotFound')
    }
  }
  

  const verifyForgotPassOpt = async (req,res)=>{
    try {
  
      const enteredOtp = req.body.otp
      console.log('entered otp',enteredOtp)
      if(enteredOtp === req.session.userOtp){
        res.render('resetPassword');
      }else{
        res.json({success:false,message:'OTP not matching'})
      }
      
    } catch (error) {
      res.status(500).json({success:false,message:'An error occured, Please try again'})
    }
  }

  const postNewPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const email = req.session.email;
        console.log("jdfhj: ",email)
        console.log('pass1 and pass2',newPassword, confirmPassword)

        if (!newPassword || !confirmPassword) {
            return res.render('resetPassword', { message: 'Passwords cannot be empty' });
        }

        if (newPassword !== confirmPassword) {
            return res.render('resetPassword', { message: 'Passwords do not match' });
        }

        
        const passwordHash = await securePassword(newPassword);

        await User.updateOne(
            { email: email }, 
            { $set: { password: passwordHash } }
        );

        
        res.redirect('/login');
    } catch (error) {
        console.error("Error in postNewPassword:", error);
        res.redirect('/pageNotFound');
    }
};

  

const sendOtpForEmailUpdatePost = async (req, res) => {
    // console.log('Request Method:', req.method);
    // console.log('Request Body:', req.body);
    // console.log('Content-Type:', req.headers['content-type']);

    try {
        const email = req.body.email;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email address is required."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format."
            });
        }

        // if (email === req.user.email) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "New email must be different from current email."
        //     });
        // }

        const otp = generateOtp();
        req.session.newEmail = email;
        req.session.userOtp = otp;
        req.session.otpGeneratedAt = Date.now();

        const emailSent = await sendVerification(email, otp);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email."
            });
        }

        console.log("Generated OTP:", otp);

        // return res.json({
        //     success: true
        //     // message: "OTP sent successfully"
        // });
        res.render('otpForEmailUpdate', { email: req.session.newEmail });
    } catch (error) {
        console.error("Error in sendOtpForEmailUpdate:", error);
        return res.status(500).json({
            success: false,
            message: "Unexpected server error",
            error: error.toString()
        });
    }
};

const sendOtpForEmailUpdateGet = (req, res) => {
   res.render('otpForEmailUpdate', { email: req.session.newEmail });
};
const emailUpdateOtp = async (req, res) => {
    try {
        const newEmail = req.session.newEmail;
        const {enteredOtp} = req.body;
        console.log('entered otp',enteredOtp)
        console.log('og otp',req.session.userOtp)

        // Check if OTP has expired (3 minutes = 180 seconds)
        const otpGeneratedAt = req.session.otpGeneratedAt;
        console.log('newEmail',newEmail)
        const currentTime = Date.now();
        
        if (!otpGeneratedAt || (currentTime - otpGeneratedAt > 180000)) {
            return res.status(400).render("otpForEmailUpdate", { 
                error: "OTP has expired. Please request a new OTP." 
            });
        }

        if (enteredOtp === req.session.userOtp) {
            const updateResult = await User.updateOne(
                { _id: req.session.user },
                { $set: { email: newEmail } }
            );

            if (updateResult.nModified === 0) {
                throw new Error("Failed to update email address.");
            }

            delete req.session.newEmail;
            delete req.session.userOtp;
            delete req.session.otpGeneratedAt;

            res.redirect("/profile");
        } else {
            res.status(400).render("otpForEmailUpdate", { error: "Invalid OTP. Please try again." });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).send("An error occurred while verifying OTP. Please try again later.");
    }
};

const resendOtpForEmailUpdate = async (req, res) => {
    try {
        // Check if newEmail exists in session
        const newEmail = req.session.newEmail;

        if (!newEmail) {
            return res.status(400).json({
                success: false,
                message: "No email update request found. Please start the email update process again."
            });
        }

        // Generate a new OTP
        const otp = generateOtp();
        
        // Update the session with the new OTP and timestamp
        req.session.userOtp = otp;
        req.session.otpGeneratedAt = Date.now(); // Reset timestamp

        // Send the new OTP via email
        const emailSent = await sendVerification(newEmail, otp);
        
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send verification email."
            });
        }

        console.log("Resent OTP:", otp);

        return res.json({
            success: true,
            message: "OTP resent successfully"
        });
    } catch (error) {
        console.error("Error in resendOtpForEmailUpdate:", error);
    }
};
  



module.exports = {
    loadHomepage,pageNotFound,loadSignup,signUp,varifyOtp,resendOtp,loadLogin,login,logout,generateOtp,sendVerification,
    loadForgotPasPage,forgotEmailValid,verifyForgotPassOpt,postNewPassword,sendOtpForEmailUpdatePost,sendOtpForEmailUpdateGet,emailUpdateOtp,
    resendOtpForEmailUpdate
}