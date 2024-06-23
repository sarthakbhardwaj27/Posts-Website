const express = require('express');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const port = 8000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MIDDLEWARES
//creating a middleware for protected routes
function isLoggedIn(req,res,next){
  //console.log(req.cookies.token);
  if(req.cookies.token === '')  res.send("You must be logged in to access this page");
  else{
    let data = jwt.verify(req.cookies.token, "secretkey");
    req.user = data;
    // console.log(`This is Jwt data: ${data}`)
  }
  next();
}

// GET ROUTES
app.get('/', (req, res) => {
  res.render('index')
})

app.get('/login',(req,res)=>{
  res.render('login')
})
app.get('/logout',(req,res)=>{
  res.cookie('token',"");
  res.redirect('/login')
})

app.get('/profile',isLoggedIn,(req,res)=>{
  // console.log(req.user)
  res.render('profile', {username:req.user.username})
})

// POST ROUTES

app.post('/register', async (req,res)=>{
  let {email,username,password,name} = req.body;
  let user = await userModel.findOne({email});
  if(user) {
    return res.status(500).render('User already registered')
  }
  bcrypt.genSalt(10, (err,salt)=>{
    if(err)
        console.log(`error generating salt: ${err}`);
    // console.log(salt)
    bcrypt.hash(password, salt, async (err,hash)=>{
      if(err){
        console.log(`error generating hash: ${err}`)
      }
      // console.log(hash);
      let user = await userModel.create({
        username, 
        name,
        email,
        password: hash
      });

      let token = jwt.sign({
        email: email, 
        userid: user._id,
        username: username
      }, "secretkey");
      res.cookie('token', token);
      // res.render('login');
      res.redirect('/login')
    })
  })
})

app.post('/login',async (req,res)=>{
  let {email, password} = req.body;
  let user = await userModel.findOne({email});
  if(!user){
    res.status(500).send("Something went wrong")
  }
  bcrypt.compare(password, user.password, (err,result)=>{
    if(result){
      let token = jwt.sign({
        email: email, 
        userid: user._id,
        username: user.username
      }, "secretkey");
      res.cookie('token', token);
      res.status(200).redirect('/profile')
    }
    else res.redirect('/login');
  });
})

app.post('/createpost',(req,res)=>{
  console.log(req.body)
  res.redirect('/profile')
})

// SERVER LISTENING
app.listen(port, ()=>{
  console.log(`listening on port: ${port}`)
})