const User = require('../models/userSchema');

const userAuth = (req,res,next)=>{
    if (req.session.user){
        User.findById(req.session.user)
        .then(data => {
            if(data && !data.isBlocked){
                next();
            }
            else{
                res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log('error in userAuth middleware',error);
            res.status(500).send('internal server error')
        })
    }
    else{
        res.redirect('/login')
    }
}

// const adminAuth = (req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data => {
//         if(data){
//             next();
//         }
//         else{
//             res.redirect('/admin/login')
//         }
//     })
//     .catch(errpr=>{
//         console.log('error in adminAuth middleware',error);
//         res.status(500).send('internal server error')
//     })
// }

const adminAuth = (req, res, next) => {
    if (req.session.user) {
        User.findById(req.session.user)
            .then(user => {
                if (user && user.isAdmin) {
                    next();  // Allow admin access
                } else {
                    res.redirect('/admin/login');  // Redirect if not an admin
                }
            })
            .catch(error => {
                console.log('Error in adminAuth middleware:', error);
                res.status(500).send('Internal server error');
            });
    } else {
        res.redirect('/admin/login');  // Redirect if no user session exists
    }
};




module.exports = {userAuth,adminAuth};