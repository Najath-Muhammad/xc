const isAuthenticated = (req,res,next)=>{
    if(req.session.admin){
        next();
    }
    else{   
        return res.redirect('/admin/login');
    }
}

const isLogin = (req,res,next)=>{
    if(!req.session.admin){
        next();
    }
    else{   
        return res.redirect('/admin/dashboard');
    }
}

module.exports = {isAuthenticated,isLogin}