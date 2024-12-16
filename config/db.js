const mongoose = require('mongoose');
const env = require('dotenv').config();

const connectDB = async function(){
    try{
     await mongoose.connect(process.env.MONGODB_URI)
     console.log('db conneccted')
    }
    catch(error){
        console.log('db connection error',error.message)
        process.exit(1);
    }
}

module.exports = connectDB;