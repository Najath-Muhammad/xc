const user = require('../../models/userSchema');



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

const signUp = async (req,res)=>{
    const {fullname,email,phone,password} = req.body;
    console.log(req.body)
    
    try{
       const newUser = new user({fullname,email,phone,password});
       await newUser.save();
       console.log(newUser)

       return res.redirect('/signup')
    }
    catch(error){
        console.log('Error in Sign-Up',error)
        res.status(500).send('internal server error')
    }
}



module.exports = {
    loadHomepage,pageNotFound,loadSignup,signUp
}