const Category = require('../../models/categorySchema');
const Products = require('../../models/productSchema');





const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        console.log(`Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments({});
        const totalPages = Math.ceil(totalCategories / limit);

        console.log(`Total Categories: ${totalCategories}, Total Pages: ${totalPages}`);

        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            errors: null,
            oldData: null
        });

    } catch (error) {
        console.error(error);
        res.redirect('/pageError');
    }
};

const addCategory = async (req,res) => {
    
    const {name,description}  = req.body;

   try {
    const existCategory = await Category.findOne({name});
    if(existCategory){
        return res.status(400).json({error:'category alredy exist'})
    }
    const newCategory = new Category({
        name,
        description
    })
    await newCategory.save();
    return res.json({message:'category created successfully'})
        
    } catch (error) {
        return res.status(500).json({error:'internal server error'})
    }
}

const addCategoryOffer = async (req, res) => {
    try {
        const percentage = parseInt(req.body.percentage, 10);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            return res.status(400).json({ error: 'Invalid percentage value' });
        }

        const categoryId = req.body.categoryId;
        if (!categoryId) {
            return res.status(400).json({ error: 'Category ID is required' });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const products = await Products.find({ category: category._id });
        // const hasProductOffer = products.some((product) => product.productOffer > percentage);

        // if (hasProductOffer) {
        //     return res
        //         .status(400)
        //         .json({ error: 'A product in this category already has a higher offer' });
        // }

        await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });
        for (const product of products) {
            product.productOffer = 0;
            product.salePrice = product.regularPrice;
            await product.save();
        }
        res.json({ status: true, message: 'Category offer added successfully' });
    } catch (error) {
        console.error('Error in addCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};



const removeCategoryOffer = async (req, res) => {
    try {
        const categoryId = req.body.categoryId;
        if (!categoryId) {
            return res.status(400).json({ status: false, message: 'Category ID is required' });
        }
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(400).json({ status: false, message: 'Category not found' });
        }

        console.log('Category:', category);

        const percentage = category.categoryOffer;


        const products = await Products.find({ category: category._id });

        console.log('Products:', products);

        if (products.length === 0) {
            return res.status(200).json({ status: true, message: 'No products to update for this category' });
        }

        for (const product of products) {

            product.salePrice = product.regularPrice;


            product.productOffer = 0;


            await product.save();
        }

        res.json({ status: true, message: 'Offer removed successfully for all products' });

    } catch (error) {
        console.error('Error in removeCategoryOffer:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
};



const getListCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }

        category.isListed = true;
        await category.save(); 

        res.json({ success: true, message: 'Category listed successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const getUnListCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        console.log(`Received request to unlist category with ID: ${categoryId}`);

        const category = await Category.findById(categoryId);
        if (!category) {
            console.log(`Category with ID: ${categoryId} not found`);
            return res.status(400).json({ success: false, message: 'Category not found' });
        }

        if (!category.description) {
            category.description = 'No description provided';
        }

        console.log(`Unlisting category: ${category.name}`);
        category.isListed = false;
        await category.save();

        console.log(`Updating products in category: ${category.name}`);
        await Products.updateMany({ category: category._id }, { $set: { isBlocked: true } });

        res.json({ success: true, message: 'Category unlisted successfully!' });
    } catch (error) {
        console.error('Error during unlisting category:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getEditCategory = async (req,res) => {
    try {
        const id = req.query.id;
        const category = await Category.findById(id);
        res.render('editCategory',{category:category})
    } catch (error) {
        res.redirect('/pageError')
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.params.id; 
        const { categoryname, description } = req.body;

        console.log('Category ID:', id);
        console.log('Category Name:', categoryname);
        console.log('Category Description:', description);

        const existing = await Category.findOne({ name: categoryname });
        if (existing && existing._id.toString() !== id) {
            return res.status(400).json({ success: false, error: 'Category name already exists' });
        }

       
        const updateCategory = await Category.findByIdAndUpdate(
            id, 
            { name: categoryname, description: description },
            { new: true }
        );

        console.log('Update Result:', updateCategory);
        if (!updateCategory) {
            return res.status(400).json({ success: false, error: 'Category not found or no changes made' });
        }
        res.redirect('/admin/category');
    } catch (error) {
        console.error("Error in editCategory:", error); 
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};




module.exports = {
    categoryInfo,addCategory,addCategoryOffer,removeCategoryOffer,getListCategory,getUnListCategory,getEditCategory,editCategory
}