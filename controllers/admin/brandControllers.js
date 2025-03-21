const Brand = require('../../models/brandSchema')
const Product = require('../../models/productSchema')

const getBrandPage = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        const reverseBrand = brandData.reverse();
        res.render('brands',{
            data: reverseBrand,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands
        })

    } catch (error) {
        res.redirect('/pageError')
    }
}


const addBrand = async (req, res) => {
    try {
        const brandName = req.body.brandName;
        const findBrand = await Brand.findOne({ brandName });

        if (!findBrand) {
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName: brandName,
                brandImage: image,
            });

            await newBrand.save();
            return res.redirect('/admin/brands');
        }

        
        return res.redirect('/admin/brands?error=Brand already exists');
    } catch (error) {
        console.error('Error adding brand:', error); 
        res.redirect('/pageError');
    }
};


const blockBrand = async (req, res) => {
    try {
        
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}})
        res.redirect('/admin/brands')

    } catch (error) {
        res.redirect('/pageError')
    }
}

const unblockBrand = async (req, res) => {
    try {
        
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/brands')

    } catch (error) {
        res.redirect('/pageError')
    }
}


const deleteBrand = async (req, res) => {
    try {
        
        const {id} = req.query;
        if(!id){
            return res.status(400).redirect('/pageError')
        }
        await Brand.deleteOne({_id:id})
        res.redirect('/admin/brands')
    } catch (error) {
        console.log("error in deleting the brand",error);
        res.status(500).redirect('/pageError')
    }
}



module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand
}