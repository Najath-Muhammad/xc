const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const pageError = async (req,res)=>{
    res.render('pageError');
}




const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard');
    }
    return res.render('admin-login',{message:null});
}

const login = async (req,res)=>{
    try {
        
        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});

        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            if(passwordMatch){
                req.session.admin = true;
                return res.redirect('/admin/dashboard');
            }
            else{
                return res.render('admin-login',{message:'Invalid Password'});
            }
        }
        else{
        return res.render('admin-login',{message: 'Access Denied. Admin only.'})
        }

    } catch (error) {
        console.log('login error',error);
        return res.redirect('/pageError')
        
    }
}

const loadDashboard = async (req,res) => {
    if(req.session.admin){
        try {
            return res.render('dashboard')
        } catch (error) {
            console.log('error loading dashboard',error);
            return res.redirect('/pageError')
        }
    }
}

const logout = async (req,res) => {
   try {

    req.session.destroy(err=>{
        if(err){
            console.log('error logging out',err);
            return res.redirect('/pageError')
        }
        return res.redirect('/admin/login')
    })

   } catch (error) {
    
    console.log("error occured while logging out",error);
    res.redirect('/pageError')
   }

}


module.exports = {
    loadLogin,login,loadDashboard,pageError,logout
}