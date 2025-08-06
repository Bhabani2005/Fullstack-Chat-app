import cloudinary from '../lib/cloudinary.js';
import { generateToken } from '../lib/utils.js';
import User from '../models/userModel.js';
import bcrypt from "bcryptjs"
export const signup = async(req, res) => {
    const { email, fullName, password } = req.body;
    try {
        if(!email || !fullName || !password) {
            return res.status(400).json({ message: "All fields are required." });   
        }
        if(password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }
        const user=await User.findOne({ email });
        if(user) {
            return res.status(400).json({ message: "Email already exists." });
        }
        const salt=await bcrypt.genSalt(10);
        const hashedassword=await bcrypt.hash(password, salt);
        const newUser=new User({
            fullName:fullName,
            email:email,   
            password:hashedassword
        });

        if(newUser) {
            generateToken(newUser._id, res);
            await newUser.save();
            return res.status(201).json({ 
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profileic: newUser.profileic,
             });
        } else{
            res.status(400).json({message:"Invalid user data."})
        }
    } catch (error) {
        res.status(500).json({message:"Internal server error."});
        console.error("Error in signup controller:", error.message);
    }
}
export const login = async(req, res) => {
   const { email, password } = req.body;
    try {
    const user= await User.findOne({ email });
    if(!user) {
        return res.status(400).json({ message: "Invalid email or password." });
    }
    const isPasswordCorrect= await bcrypt.compare(password,user.password);
    if(!isPasswordCorrect) {
        return res.status(400).json({ message: "Invalid email or password." });
    }
    generateToken(user._id, res);
    res.status(200).json({
        _id: user._id,
        fullName: user.fullName,    
        email: user.email,
        profileic: user.profileic,
    });
   } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.log("Error in login controller:", error.message);
   }
}
export const logout = (req, res) => {
   try {
    res.cookie("jwt", "", {maxAge:0})
    res.status(200).json({ message: "Logged out successfully." });
   } catch (error) {
    res.status(500).json({ message: "Internal server error." });
    console.log("Error in logout controller:", error.message);
   }
}
export const updateProfile = async (req, res) => {
    try {
        const{profilepic}=req.body;
        const userId=req.user._id;
        if(!profilepic) {
            return res.status(400).json({ message: "Profile picture is required." });
        }
        const uploadResponse =await cloudinary.uploader.upload(profilepic)
        const updatedUser=await User.findByIdAndUpdate(
            userId,{profilepic:uploadResponse.secure_url},{ new: true })
            res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in updateProfile controller:", error.message);
        res.status(500).json({ message: "Internal server error." });
        
    }
};
export const checkAuth = async(req, res) => {
     try {
    const user = await User.findById(req.user._id).select("-password"); // exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
    } catch (error) {
        console.log("Error in checkAuth controller:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
}