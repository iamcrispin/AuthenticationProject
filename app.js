require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/userDB');
mongoose.set('strictQuery', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });  

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.post('/register', async function(req, res){
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = new User({
            email: req.body.username,
            password: hashedPassword
        });
    
        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.log(err);
        res.redirect('/register');
    }
});

app.post('/login', async function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    try {
        const foundUser = await User.findOne({ email: username });
        if (foundUser) {
            const match = await bcrypt.compare(password, foundUser.password);
            if (match) {
                res.render("secrets");
            } else {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    } catch (err) {
        console.log(err);
        res.redirect('/login');
    }
});

     







app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});