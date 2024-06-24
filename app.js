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
    req.user = data; //we are adding the data into req so that it can be retrieved later on
    // console.log(`This is Jwt data: ${data}`)
  }
  next();
}

// GET ROUTES
app.get('/', (req, res) => {
  res.render('home')
})

app.get('/login',(req,res)=>{
  res.render('login')
})
app.get('/logout',(req,res)=>{
  res.cookie('token',"");
  res.redirect('/')
})

app.get('/profile',isLoggedIn, async (req,res)=>{
  // console.log(req.user)
  let user = await userModel.findOne({email: req.user.email}).populate("posts");
  // console.log(posts)
  res.render('profile', {user})
})

app.get('/deletepost/:id', async (req,res)=>{
  console.log(req.params.id)
  let post = await postModel.findOneAndDelete({_id: req.params.id});
  console.log(post)
  res.redirect('/profile')
  // console.log(post);
})

app.get('/editpost/:id',isLoggedIn, async (req,res)=>{
  let post = await postModel.findOne({_id: req.params.id});
  let user = await userModel.findOne({email: req.user.email})
  res.render('editpost',{user, post})
  // console.log(post);
})

app.post('/updatepost/:id', async (req,res)=>{
  let {postData} = req.body;
  console.log(postData)
  console.log(req.params.id)
  // let deletepost = await postModel.findOneAndDelete({_id: req.params.id});
  let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: postData});
  if (!post) {
    return res.status(404).send('Post not found');
  }
  console.log('Updated Post:', post);
  res.redirect('/profile')
})
// POST ROUTES

app.post('/register', async (req,res)=>{
  let {email,username,password,name} = req.body;
  let user = await userModel.findOne({email});
  if(user) {
    return res.status(500).send('User already exists');
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
        username: username //added username so that we can use ejs to populate the username in profile page
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
    res.status(500).redirect('/')
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

app.post('/createpost',isLoggedIn,async (req,res)=>{
  // console.log(req.body)
  const postData = req.body.postData;
  const user = await userModel.findOne({email: req.user.email})
  let post = await postModel.create({
    userId: user._id,
    username: user.username,
    content: postData,
  })
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile')
})

// SERVER LISTENING
app.listen(port, ()=>{
  console.log(`listening on port: ${port}`)
})