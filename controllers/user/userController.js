const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const env = require('dotenv').config();
const bcrypt = require('bcrypt');




const pageNotFound =async (req,res) => {
    try{
        
    }
    catch(error){
        res.redirect('/pageNotFound'); 
    }
}




const loadHomepage = async (req,res)=>{
    try{
        return res.render('home')
    }
    catch(error){
      console.log('home page not found');
      res.status(500).send('server error')
    }
}

const loadSignup = async (req,res)=>{
    try{
        return res.render('signup');
    }
    catch(error){
        console.log('sign up page not loading:',error);
        res.status(500).send('Server Error');
    }
}


//otp generation
function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

//OTP varification
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
        req.session.userData = {fullname,email,phone,password}
 
        res.render('verify-otp');
        console.log("OTP sent",otp);
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
            res.json({success:true,redirectUrl:'/'})  //path after the signUp
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



module.exports = {
    loadHomepage,pageNotFound,loadSignup,signUp,varifyOtp
}