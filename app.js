const express = require('express');
const app = express();
const env = require('dotenv').config();
const session = require('express-session')
const db = require('./config/db');
const path = require('path');
const userRouter = require('./routes/userRouter')
db();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        maxAge: 24 * 3600 * 1000
    }
}))

app.set('view engine','ejs');
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'view/admin')]);
app.use(express.static(path.join(__dirname,'public')));

app.use('/',userRouter);

app.listen(process.env.PORT,()=>{
    console.log('server started at port '+process.env.PORT)
})


module.exports = app