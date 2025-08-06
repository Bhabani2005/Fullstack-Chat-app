import { getReceiverSocketId } from "../lib/socket.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import cloudinary from 'cloudinary';
import { io } from "../lib/socket.js";
export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ message: "Internal server error" });

    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userTochatId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userTochatId },
                { senderId: userTochatId, receiverId: myId }
            ]
        })
        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages Controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const sendMessages = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const senderId = req.user._id;
        const { text, image } = req.body;
        
        console.log("Sender:", senderId);
        console.log("Receiver:", receiverId);
        console.log("Text:", text);
        console.log("Image:", image);

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        await newMessage.save();
        
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessages Controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
}