const passport = require('passport');
const GoogleStrtategy = require('passport-google-oauth20').Strategy;
const env = require('dotenv').config();

const User = require('../models/userSchema');

passport.use(new GoogleStrtategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
            return done(null,user);
        }
        else{
            user = await User({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            });
            await user.save();
            return done(null,save);
        }
    } catch (error) {
        return done(error,null);
    }

}

));

passport.serializeUser((user,done)=>{
    done(null,user,id)
});

passport.deserializeUser((id,done)=>{
    user.findById(id)
    .then(user=>{
        done(null,user);
    })
    .catch(error=>{
        done(error,null)
    })
})


module.exports = passport;