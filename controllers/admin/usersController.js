const User = require('../../models/userSchema');


// const userInfo = async (req,res) => {
//     try {
        
//         let search = '';
//         if(req.query.search){
//             search = req.query.search;
//         }
//         let page = 1;
//         if(req.query.page){
//             page = req.query.page;
//         }
//         const limit = 3;
//         const userData = await User.find({
//             isAdmin:false,
//             $or: [
//                 {fullname:{$regex:'.*'+search+'.*'}},
//                 {email:{$regex:'.*'+search+'.*'}},
//             ]
//         })
//         .limit(limit*1)
//         .skip((page-1)*limit)
//         .exec();

//         const count = await User.find({
//             isAdmin:false,
//             $or: [
//                 {fullname:{$regex:'.*'+search+'.*'}},
//                 {email:{$regex:'.*'+search+'.*'}},
//             ]
//         }).countDocuments();

//         res.render('users')

//     } catch (error) {
        
//     }
// }

const userInfo = async (req, res) => {
    try {
        let search = req.query.search || '';  
        let page = parseInt(req.query.page) || 1;  
        const limit = 3; 

        
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { fullname: { $regex: '.*' + search + '.*', $options: 'i' } },  
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        })
            .limit(limit)  
            .skip((page - 1) * limit)  
            .exec();

       
        const count = await User.find({
            isAdmin: false,
            $or: [
                { fullname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).countDocuments();

       
        const totalPages = Math.ceil(count / limit);

        
        res.render('users', {
            userData,
            search,
            page,
            totalPages,
            count
        });
    } catch (error) {
        console.log('Error fetching user data:', error);
        res.redirect('/pageError');  
    }
};

// const addUser = async (req, res) => {
//     try {
//         const { fullname, email } = req.body;
//         const newUser = new User({ fullname, email, isBlocked: false });
//         await newUser.save();
//         res.redirect('/admin/users');
//     } catch (error) {
//         console.error('Error adding user:', error);
//         res.redirect('/pageError');
//     }
// };


const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (user) {
            user.isBlocked = true;
            await user.save();
            req.session.user = false;
            res.redirect('/admin/users');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        res.redirect('/pageError');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (user) {
            user.isBlocked = false;
            await user.save();
            res.redirect('/admin/users');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.redirect('/pageError');
    }
};


const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.redirect('/pageError');
    }
};

const changePassword = async (req,res)=>{
    try {
  
      res.render('changePassword')
      
    } catch (error) {
      console.log('change-password error',error)
      res.redirect('/pageNotFound')
      
    }
  }
  
  const changePasswordValid = async (req,res)=>{
    try {
  
      const {email} = req.body
      const userExist = await User.findOne({email})
      if(userExist){
        const otp = generateOtp()
        const emailSent = await sendVerificationEmail(email,otp)
        if(emailSent){
          req.session.userOtp = otp
          req.session.userData = req.body
          req.session.email = email
          res.render('change-password-otp')
          console.log('OTP:',otp)
        }else{
          res.json({
            success:false,
            message:'failed to send otp, try again'
  
          })
        }
      }else{
        res.render('change-password',{
          message:'User with this email does not exis'
        })
      }
      
    } catch (error) {
      console.log('error in change password validation',error)
      res.redirect('/pageNotFound')
    }
  }
  
  const verifychangePassOtp = async (req,res)=>{
    try {
      console.log("hello verify otppp")
      const enteredOtp = req.body.otp
      console.log('enterd otp ',enteredOtp)
      if(enteredOtp === req.session.userOtp){
        res.redirect('/reset-password')
      }else{
        res.json({success:false,message:'otp not matching'})
      }
      
    } catch (error) {
      console.log("error working")
      res.status(500).json({success:false,message:'an error occured, Please try again later'})
    }
  }
module.exports = {
    userInfo,
    blockUser,
    unblockUser,
    deleteUser,
    changePassword,
    changePasswordValid,
    verifychangePassOtp
};