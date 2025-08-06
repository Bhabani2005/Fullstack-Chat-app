import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './lib/db.js';
import authRoutes from './routes/auth.js';
import cookieParser from 'cookie-parser';
import messageRoutes from './routes/messageRoute.js';
import cors from 'cors';
import { app,server } from './lib/socket.js';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();
// const app=express();
const PORT=process.env.PORT;
const __filename= fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json({limit: '50mb'}));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use("/api/auth",authRoutes)
app.use("/api/messages",messageRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../Frontend/dist')));
    app.get('/*splat', (req, res) => {
        res.sendFile(path.join(__dirname, '../Frontend', 'dist', 'index.html'));
    });
}
server.listen(PORT,()=>{
    console.log("Server is running on PORT:"+PORT);
    connectDB();
})
