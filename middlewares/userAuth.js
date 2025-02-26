const userAuth = (req,res,next)=>{
    if(req.session.user){
        return next();
    }
    else{   
        return res.redirect('/login');
    }
}
const userLogin = (req,res,next)=>{
    if(req.session.user){
        return res.redirect('/');884
    }
    else{   
        return next();
    }
}

module.exports = {userAuth,userLogin}