const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema')
const Brand = require('../../models/brandSchema')
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Offer = require('../../models/offerSchema');



const getProductAddPage = async (req,res) => {
    try {
        
        const category = await Category.find({isListed:true});
        // console.log(category)
        const brand = await Brand.find({isBlocked:false});
        res.render('productAdd',{
            cat:category,
            brand:brand
        })

    } catch (error) {
        res.redirect('/pageError');
    }
}


// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;
//         console.log('Uploaded Files:', req.files);
//         const productExist = await Product.findOne({ productName: products.productName });
//         if (!productExist) {
//             const images = [];
//             if (req.files.length > 0) {
//                 for (let i = 0; i < req.files.length; i++) {
//                     const originalImagePath = req.files[i].path;
//                     const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);
//                     await sharp(originalImagePath).resize({ width: 440, height: 440 }).toFile(resizedImagePath,(err, info) => {
//                         if (err) {
//                             console.log('Error processing image:', err);
//                         } else {
//                             console.log('Image processed successfully:', info);
//                         }
//                         console.log('Saving to:', resizedImagePath);
        
//                 });
//                     images.push(req.files[i].filename); 
//                 }
//             }

//             const category = await Category.findOne({ _id: products.category });
//             if (!category) {
//                 return res.status(400).send('Invalid category name');
//             }
//             const categoryId = category._id;

//             const newProduct = new Product({
//                 productName: products.productName,
//                 description: products.description,
//                 brand: products.brand,
//                 category: categoryId,
//                 regularPrice: products.regularPrice,
//                 salePrice: products.salePrice,
//                 createdOn: new Date(),
//                 quantity: products.quantity,
//                 size: products.size,
//                 color: products.color,
//                 productImage: images,
//                 status: 'Available'
//             });

//             await newProduct.save();
//             res.redirect('/admin/addProducts').status(200);
//         } else {
//             return res.status(400).json({ message: 'Product already exists' });  // Corrected error message
//         }

//     } catch (error) {
//         console.log('Error saving product:', error);
//         return res.status(500).json({ message: 'Error saving product', error: error.message });  // Improved error handling
//     }
// };

     

const addProducts = async (req, res) => {
    try {
        const products = req.body;
        // console.log('Received product data:', products);
        // console.log('Received files:', req.files);

        const productExist = await Product.findOne({ productName: products.productName });
        if (productExist) {
            return res.status(400).json({ message: 'Product already exists' });
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const originalImagePath = file.path;
                    const filename = `${Date.now()}-${file.originalname}`;
                    const resizedImagePath = path.join('public', 'uploads', 're-image', filename);

                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440, fit: 'cover' })
                        .toFile(resizedImagePath);

                    images.push(filename);
                    
                    // // Clean up original file
                    // fs.unlink(originalImagePath, (err) => {
                    //     if (err) console.error('Error deleting original file:', err);
                    // });
                } catch (err) {
                    console.error('Error processing image:', err);
                }
            }
        }

        const category = await Category.findById(products.category);
        const brand =  await Brand.findById(products.brand)
        if (!category) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            brand: brand.brandName,
            category: products.category,
            regularPrice: Number(products.regularPrice),
            salePrice: Number(products.salePrice) || null,
            createdOn: new Date(),
            quantity: Number(products.quantity),
            color: products.color,
            productImage: images,
            status: 'Available'
        });

        await newProduct.save();
        res.redirect('/admin/addProducts')

    } catch (error) {
        console.error('Error saving product:', error);
        res.status(500).json({ 
            message: 'Error saving product', 
            error: error.message 
        });
    }
};

const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 4;

        // Find all offers
        const offers = await Offer.find({ 
            isActive: true, 
            expiring: { $gte: new Date() } 
        });

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", 'i') } },
                { brand: { $regex: new RegExp(".*" + search + ".*", 'i') } },
            ]
        }).limit(limit)
        .skip((page - 1) * limit)
        .populate('category')
        .populate('offer')
        .exec();
        
        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", 'i') } },
                { brand: { $regex: new RegExp(".*" + search + ".*", 'i') } },
            ]
        }).countDocuments();

        const category = await Category.find({ isListed: true }).exec();
        const brand = await Brand.find({ isBlocked: false }).exec();

        if (category && brand) {
            res.render('products', {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                search,
                cat: category,
                brand: brand,
                offers 
            });
        } else {
            res.render('page-404');
        }
    } catch (error) {
        console.log('Error fetching products:', error);
        res.redirect('/admin/pageError');
    }
};

const blockProduct = async (req,res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect('/admin/products');
    } catch (error) {
        res.redirect('/pageError')
    }
}

const unBlockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false}})
        res.redirect('/admin/products');
    } catch (error) {
        res.redirect('/pageError')
    }
}


const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id}).populate('category');
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render('editProduct',{
            product: product,
            cat: category,
            brand: brand
        })
    } catch (error) {
        res.redirect('/admin/pageError')
    }
}



const editProducts = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const files = req.files;
        console.log('Request Body:', data);
        console.log('Uploaded Files:', files);
        
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id },
        });
        
        if (existingProduct) {
            return res.status(400).json({
                error: 'Product with this name already exists. Please try with another name.',
            });
        }
        
        const currentProduct = await Product.findById(id);
        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let allImages = [];

        if (data.existingImages) {
            const existingImages = Array.isArray(data.existingImages)
                ? data.existingImages
                : [data.existingImages];
            
            allImages = [...existingImages];
            console.log('Selected existing images:', allImages);
        } else {
            console.log('No existing images selected');
        }
        
        if (files && files.length > 0) {
            const newImages = files.map((file) => file.filename);
            allImages = [...allImages, ...newImages];
            console.log('All images before limiting:', allImages);
        }
        
        const updatedImages = allImages.slice(0, 3);
        console.log('Final limited images array (max 3):', updatedImages);
        
        const category = await Category.findOne({name: data.category});
        
        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: data.brand,
            category: category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
            productImage: updatedImages,
        };
        
        console.log('Final product images to save:', updateFields.productImage);
        
        const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, { new: true });
        
        if (!updatedProduct) {
            throw new Error('Failed to update product');
        }
        
        if (files && files.length > 0) {
            const savedImages = updateFields.productImage;
            const uploadedImages = files.map(file => file.filename);
            
            const unusedImages = uploadedImages.filter(img => !savedImages.includes(img));
            
            if (unusedImages.length > 0) {
                console.log('Unused images that could be deleted:', unusedImages);                
            }
        }
        
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error in editProducts:', error);
        res.status(500).json({ error: error.message });
    }
};


const deleteSingleImage = async (req,res) => {
    try {
        
        const {imageNameToServer,productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}});
        const imagePath = path.join('public','uploads','re-image',imageNameToServer)
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync('imagePath')
            console.log(`Image ${imageNameToServer} deleted`)
        }else{
            console.log(`Image ${imageNameToServer} not found`)
        }
        res.send({status:true});

    } catch (error) {
        res.redirect('/pageError')
    }
}

// const addProductOffer = async (req, res) => {
//     try {
//         const { productId, percentage } = req.body;
//         if (!productId || !percentage) {
//             return res.status(400).json({ status: false, message: "Product ID and percentage are required" });
//         }

//         const parsedPercentage = parseInt(percentage);
//         if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
//             return res.status(400).json({ status: false, message: "Percentage must be a valid number between 0 and 100" });
//         }

//         const findProduct = await Product.findOne({ _id: productId });
//         if (!findProduct) {
//             return res.status(404).json({ status: false, message: "Product not found" });
//         }

//         const findCategory = await Category.findOne({ _id: findProduct.category });
//         if (!findCategory) {
//             return res.status(404).json({ status: false, message: "Category not found" });
//         }

//         if (findCategory.categoryOffer > parsedPercentage) {
//             console.log('Category offer is higher than product offer');
//             return res.status(400).json({ status: false, message: "This product category offer is higher than the product offer" });
//         }

//         const salePrice = findProduct.regularPrice - Math.floor(findProduct.regularPrice * (parsedPercentage / 100));
//         if (salePrice < 0) {
//             console.log('Calculated sale price is negative');
//             return res.status(400).json({ status: false, message: "Calculated sale price cannot be negative" });
//         }

//         findProduct.salePrice = salePrice;
//         findProduct.productOffer = parsedPercentage;

//         await findProduct.save();

//         if (findCategory.categoryOffer > 0) {
//             findCategory.categoryOffer = 0;
//             await findCategory.save();
//         }

//         res.json({ status: true });

//     } catch (error) {
//         console.error('Error adding offer:', error);
//         res.status(500).json({ status: false, message: 'Internal server error' });
//     }
// };

const addProductOffer = async (req, res) => {
    try {
        const { productId, offerId } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ status: false, message: 'Product not found' });
        }

        // Find the offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.json({ status: false, message: 'Offer not found' });
        }

        // Check if the product's category already has an active offer
        const categoryOffer = await Offer.findOne({
            category: product.category,
            isActive: true,
            expiring: { $gte: new Date() }
        });

        if (categoryOffer && product.productOffer != 0 ) {
            return res.json({ 
                status: false, 
                message: `Category already has an active offer: ${categoryOffer.name} (${categoryOffer.discount}%)` 
            });
        }

        // Update product with offer
        product.productOffer = parseFloat(offer.discount);
        product.offer = offer._id;

        // Recalculate sale price
        const discountAmount = product.regularPrice * (offer.discount / 100);
        product.salePrice = product.regularPrice - discountAmount;

        // Save the product
        await product.save();

        // Add product to offer's products array
        offer.products.push(productId);
        await offer.save();

        res.json({ status: true, message: 'Offer added successfully' });
    } catch (error) {
        console.error('Error adding product offer:', error);
        res.json({ status: false, message: 'Internal server error' });
    }
};


// const removeProductOffer = async (req, res) => {
//     try {
//         const { productId } = req.body;

//         if (!productId) {
//             console.log('Invalid input: Missing productId');
//             return res.status(400).json({ status: false, message: "Product ID is required" });
//         }

//         const findProduct = await Product.findOne({ _id: productId });
//         if (!findProduct) {
//             console.log('Product not found');
//             return res.status(404).json({ status: false, message: "Product not found" });
//         }

//         const percentage = findProduct.productOffer;

//         findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100));
//         findProduct.productOffer = 0;

//         await findProduct.save();
//         res.json({ status: true });
//     } catch (error) {
//         console.error('Error removing offer:', error);
//         res.status(500).json({ status: false, message: 'Internal server error' });
//     }
// };

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.json({ status: false, message: 'Product not found' });
        }

        // If there's an existing offer, remove it from the offer's products array
        if (product.offer) {
            await Offer.findByIdAndUpdate(product.offer, {
                $pull: { products: productId }
            });
        }

        // Reset product offer details
        product.productOffer = 0;
        product.offer = undefined;
        product.salePrice = product.regularPrice;

        // Save the product
        await product.save();

        res.json({ status: true, message: 'Offer removed successfully' });
    } catch (error) {
        console.error('Error removing product offer:', error);
        res.json({ status: false, message: 'Internal server error' });
    }
};

module.exports = {
    getProductAddPage,addProducts,getAllProducts,blockProduct,unBlockProduct,
    getEditProduct,editProducts,deleteSingleImage,addProductOffer,removeProductOffer
}