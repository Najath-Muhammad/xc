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
        let search = req.query.search || '';  // Get search query, default to empty string
        let page = parseInt(req.query.page) || 1;  // Get page number, default to 1
        const limit = 3;  // Set limit per page

        // Query to fetch users based on search input
        const userData = await User.find({
            isAdmin: false,
            $or: [
                { fullname: { $regex: '.*' + search + '.*', $options: 'i' } },  // Case-insensitive search
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        })
            .limit(limit)  // Limit the number of results per page
            .skip((page - 1) * limit)  // Skip results based on current page
            .exec();

        // Get the total count of users matching the search query
        const count = await User.find({
            isAdmin: false,
            $or: [
                { fullname: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(count / limit);

        // Render the users page and pass data to the template
        res.render('users', {
            userData,
            search,
            page,
            totalPages,
            count
        });
    } catch (error) {
        console.log('Error fetching user data:', error);
        res.redirect('/pageError');  // Redirect to an error page if something goes wrong
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

// Controller to block a user
const blockUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (user) {
            user.isBlocked = true;
            await user.save();
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

// Controller to delete a user
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