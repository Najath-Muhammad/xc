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

module.exports = {
    userInfo,
    blockUser,
    unblockUser,
    deleteUser,
};