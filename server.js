const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require("mongoose");
require('dotenv').config();
app.use(cors());
const multer=require('multer');
const cloudinary=require("./cloudinary");
const{CloudinaryStorage}=require('multer-storage-cloudinary');

const storage=new CloudinaryStorage({
    cloudinary,
    params: async(req, file) =>{
        return{
            folder: "pets",
            resource_type: "image",
            allowedFormats: "jpg"
        };
    }
});
const upload=multer({storage: storage});
const User = require('./models/user');
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const Pet = require('./models/Pet');
const Request = require('./models/Request');
app.post("/upload", upload.single("image"), (req, res) => {
    try{
        console.log("FILE Recieved",req.file);
        if(!req.file){
            return res.status(400).json({ error: "No file recieved" });
        } 
        return res.json({ imageUrl: req.file.path });
    }catch(error){
        console.error("UPLOAD ERROR:",error);
        return res.status(500).json({ error: "Image upload failed" });
    }
});
app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected "))
  .catch(err => console.log(err));

console.log("ENC CHECK:",{
    cloud:process.env.CLOUD_NAME,
    key:process.env.CLOUD_API_KEY ? "exists" : "missing",
    secret:process.env.CLOUD_API_SECRET ? "exists" : "missing"
});

app.get('/', (req, res) => {
    res.send('Server is running.');
});

app.post("/add-pet", async (req, res) => {
    try {
        const { name, age, breed, category, image } = req.body;
        const pet = new Pet({ name, age, breed, category, image });
        await pet.save();
        res.status(201).json(pet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists" });
    }
    const hashedPassword =
      await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    await user.save();
    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.post("/login", async(req,res) => {
    try{
        const{email,password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                message: "User not found"
            });
        }
        const isMatch= await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                message: "Invalid Credentials"
            });
        }
        const token=jwt.sign(
            { id: user._id}, "secretkey", {expiresIn: "1d"}
        );
        res.status(200).json({
            message: "Login successful", token
        });
    }catch(error){
        res.status(500).json({
            error: error.message
        });
    }
});

app.post("/adopt", async(req,res) => {
    try{
        const {petName,userEmail}=req.body;
        const request= new Request({
            petName,userEmail
        });
        await request.save();
        res.status(201).json({message: "Adoption request sent"});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/pets", async (req, res) => {
    try {
        const pets = await Pet.find();
        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/requests", async (req, res) => {
    try {
        const requests = await Request.find();
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/delete-pet/:id", async (req, res) => {
    try {
        await Pet.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Pet deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/update-pet/:id", async (req, res) => {
    try {
        const { name, age, breed, category, image } = req.body;
        const updatedPet = await Pet.findByIdAndUpdate(req.params.id, { name, age, breed, category, image }, { new: true });
        res.status(200).json(updatedPet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/test", (req, res) => {
    res.send("Test route is working.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

console.log("ENV:", process.env.MONGO_URI);
