import { create } from 'zustand'
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.MODE === "development"?'http://localhost:5001':"/";
export const useAuthStore = create((set,get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
            const response = await axiosInstance.get('/auth/check');
            set({ authUser: response.data });
            get().connectToSocket();
        } catch (error) {
            console.error('Error checking auth:', error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },
    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const response = await axiosInstance.post('/auth/signup', data);
            set({ authUser: response.data });
            toast.success('Signup successful! Please log in.');
            get().connectToSocket();
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Signup failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            set({ isSigningUp: false });
        }
    },
    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
            set({ authUser: null });
            toast.success('Logged out successfully.');
            get().disconnectSocket();
        } catch (error) {
            console.error('Error logging out:', error);
            toast.error('Logout failed. Please try again.');
        }
    },
    login: async (data) => {
        set({ isLoggingIn: true });
        try {
            const response = await axiosInstance.post('/auth/login', data);
            set({ authUser: response.data });
            toast.success('Login successful!');
            get().connectToSocket();
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Login failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            set({ isLoggingIn: false });
        }
    },
    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const response = await axiosInstance.put('/auth/update-profile', data);
            set({ authUser: response.data });
            toast.success('Profile updated successfully!');
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Profile update failed. Please try again.';
            toast.error(errorMessage);
        } finally {
            set({ isUpdatingProfile: false });
        }
    },
    connectToSocket: () => {
        const {authUser} = get();
        if(!authUser || get().socket?.connected) return;
        const socket = io(BACKEND_URL,{
            query:{
                userId: authUser._id,
            }
        });
        socket.connect();
        set({ socket: socket });
        socket.on('getOnlineUsers', (userIds) => {
            set({ onlineUsers: userIds });
        });
    },
    disconnectSocket: () => {
        if(get().socket?.connected) get().socket.disconnect();
    },
}))