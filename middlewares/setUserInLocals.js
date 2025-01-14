
function setUserInLocals(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
    } else {
        res.locals.user = null;
    }
    next();
}

module.exports = setUserInLocals;