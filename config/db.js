const mongoose = require('mongoose');
const env = require('dotenv').config();

const connectDB = async function(){
    try{
     const conn = await mongoose.connect(process.env.MONGODB_URI)
     console.log("connection name",conn.connection.host)
     console.log("datbaase name",conn.connection.name)
    }
    catch(error){
        console.log('db connection error',error.message)
        process.exit(1);
    }
}

module.exports = connectDB;