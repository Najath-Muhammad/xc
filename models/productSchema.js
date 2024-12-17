const mongoose = require('mongoose');
const {Schema} = mongoose;

    const productSchema = new Schema({
        productName:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        brand:{
            type:String,
            required:true
        },
        category:{
            type:String,
            ref:"Category",
            required:true
        },
        regularPrice:{
            type:Number,
            required:true
        },
        salePrice:{
            type:Number,
            required:true
        },
        productOffer:{
            type:Number,
            default:0
        },
        quantity:{
            type:Number,
            required:true
        },
        color:{
            type:String,
            required:true
        },
        productImage:{
            type:[String],
            required:true
        },
        isBlocked:{
            type:Boolean,
            default:false
        },
        status:{
            type:String,
            enum:["Available","Out Of Stock","Discontinued"],
            required:true,
            default:"Available"
        }

    },{timestamps:true});

    const Products = mongoose.model("Products", productSchema);

    module.exports = Products;