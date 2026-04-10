require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose').default;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: 'OurLittleSecret.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');
mongoose.set('strictQuery', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });  

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user.id);
    });
  });
  
passport.deserializeUser(function(id, cb) {
    User.findById(id, function(err, user) {
      return cb(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/', (req, res) => {
    res.render("home");
});

app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect('/login');
    }
}); 

app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

app.post('/register', async function(req, res){

    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, function() {
                res.render("secrets");
            });
        }
    });
    
    
    // try {
    //     const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hashedPassword
    //     });
    
    //     await newUser.save();
    //     res.render("secrets");
    // } catch (err) {
    //     console.log(err);
    //     res.redirect('/register');
    // }
});

app.post('/login', async function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
            res.redirect('/login');
        } else {
            passport.authenticate('local')(req, res, function(){
                res.redirect('/secrets');
            });
        }
    })
    
    
    // const username = req.body.username;
    // const password = req.body.password;

    // try {
    //     const foundUser = await User.findOne({ email: username });
    //     if (foundUser) {
    //         const match = await bcrypt.compare(password, foundUser.password);
    //         if (match) {
    //             res.render("secrets");
    //         } else {
    //             res.redirect('/login');
    //         }
    //     } else {
    //         res.redirect('/login');
    //     }
    // } catch (err) {
    //     console.log(err);
    //     res.redirect('/login');
    // }
});

     







app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});