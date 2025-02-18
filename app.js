const express = require('express');
const app = express();
const env = require('dotenv').config();
console.log('Env loaded:', process.env.RAZORPAY_KEY_ID ? 'Razorpay key found' : 'Razorpay key missing');
const session = require('express-session')
const db = require('./config/db');
const path = require('path');
const userRouter = require('./routes/userRouter')
const passport = require('./config/passport');
const adminRouter = require('./routes/adminRouter')
const MongoStore = require('connect-mongo'); 
const setUserInLocals = require('./middlewares/setUserInLocals')
// const nocache = require('nocache');
db();

// app.use(nocache());
app.use(express.json());
app.use(express.urlencoded());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/yourdb',
        collectionName: 'sessions'
    }),
    cookie:{
        secure:false,
        maxAge: 24 * 3600 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(setUserInLocals);
app.use((req, res, next) => {
    res.locals.cart = req.session.cart;
    next();
});

app.set('view engine','ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin'), 
]);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',userRouter);
app.use('/admin',adminRouter)

app.listen(process.env.PORT,()=>{
    console.log('server started at port '+process.env.PORT)
})


module.exports = app