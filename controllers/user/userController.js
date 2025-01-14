const User = require('../../models/userSchema');
const Category =  require('../../models/categorySchema');
const Product =  require('../../models/productSchema');
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
        const user = req.session.user;
        const categories = await Category.find({ isListed: true });
        let products = await Product.find({
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            quantity: { $gt: 0 }
        });
    
  
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        products = products.slice(0, 4);
        // console.log(products);
        if (user) {
            const userData = await User.findOne({ id: user.id });
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

  


const signUp = async (req,res)=>{
    const {fullname,email,phone,password} = req.body;
    
    try{
       const newUser = new User({fullname,email,phone,password});
       const findUser = await User.findOne({email});
       if(findUser){
        return res.render('signup',{message:"email already exist"});
       }

       const otp = generateOtp();
       const emailSent = await sendVerification(email,otp);
       if(!emailSent){
        return res.json("email error")
       }
       else{
        req.session.userOtp = otp;
        req.session.user = {fullname,email,phone,password}
        
        console.log("OTP sent",otp);
        return res.render('verify-otp');
       
       }
      
    }
    catch(error){
        console.log('Error in Sign-Up',error);
        res.redirect("/pageNotFound");
    }
}


const securePassword = async (password)=>{
  try {
    const passworHash = await bcrypt.hash(password,10)
    return passworHash;
  } catch (error) {
    console.log('Error hashing password:', error);
    throw new Error('Error hashing password');
  }
}


const varifyOtp =async(req,res)=>{
    try{
        if(!req.session.user){
            const {otp} = req.body;
            console.log(otp)
            if(otp === req.session.userOtp){
                const user = req.session.userData;
                const passwordHash = await securePassword(user.password);
    
                const saveUserData = new User({
                   fullname:user.fullname,
                   email:user.email,
                   phone:user.phone,
                   password:passwordHash
                })
    
                await saveUserData.save();
                req.session.user = saveUserData._id;
                res.json({success:true,redirectUrl:'/'})  
            }
            else{
                res.redirect('/')
            }
        
        }
        else{
            res.status(400).json({success:false,message:'invalid OTP'})
        }
    }
    catch(error){
        console.error('Error Verifying OTP',error);
        res.status(500).json({success:false,message:'Internal Server error'})
    }
}


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

        req.session.user = findUser.id;
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




module.exports = {
    loadHomepage,pageNotFound,loadSignup,signUp,varifyOtp,resendOtp,loadLogin,login,logout
}