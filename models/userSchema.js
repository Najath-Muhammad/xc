const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    fullname:{
        type:String,
        required :true
    },
    email:{
        type:String,
        required: true,
        unique: true,
    },
    phone :{
        type: String,
        required: true,
        unique:false,
        sparse:false,
        default: null
    },
    googleId:{
        type:String,
        unique:false
    },
    password:{
        type: String,
        required:true
    },
    isBlocked: {
        type: Boolean,
        default:false
    },
    isAdmin :{
        type: Boolean,
        default:false
    },cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart"
    }],
    wallet:{
        type:Number,
        default:0
    },
    wishlist:[{
        type: Schema.Types.ObjectId,
        ref:'Wishlist'
    }],
    orders:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default: Date.now
    },
    searchHistory:[{
        catefogory:{
            type:Schema.Types.ObjectId,
            ref: "Category"
        },
        brand:{
            type:String,
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
    }]
    
})

const User = mongoose.model('User',userSchema);

module.exports = User;