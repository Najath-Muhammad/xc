const express = require('express');
const app = express();
const env = require('dotenv').config();
const session = require('express-session');
const db = require('./config/db');
const path = require('path');
const userRouter = require('./routes/userRouter');
const passport = require('./config/passport');
const adminRouter = require('./routes/adminRouter');
const MongoStore = require('connect-mongo');
const setUserInLocals = require('./middlewares/setUserInLocals');

// Initialize database connection
db();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: false,
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

// View engine setup
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin')
]);
app.use(express.static(path.join(__dirname, 'public')));

// Routes setup
app.use('/', userRouter);
app.use('/admin', adminRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server started at port ' + PORT);
});

module.exports = app;