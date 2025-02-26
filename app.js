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

db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/yourdb',
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

app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/user'),
    path.join(__dirname, 'views/admin'),
]);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use((req, res, next) => {
    res.status(404);
    const isAdminRoute = req.originalUrl.startsWith('/admin');

    try {
        res.render(isAdminRoute ? "pageError" : "page-404");
    } catch (error) {
        console.error("Error rendering 404 page:", error);
        res.send("404 Page Not Found");
    }
});

app.listen(process.env.PORT, () => {
    console.log('Server started at port ' + process.env.PORT);
});

module.exports = app;
