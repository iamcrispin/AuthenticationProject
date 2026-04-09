require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

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


userSchema.plugin(encrypt, { secret: secret, encryptedFields: ['password'] });  

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
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    try {
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
        if (foundUser && foundUser.password === password) {
            res.render("secrets");
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