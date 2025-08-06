import {create} from 'zustand';
import toast from 'react-hot-toast';
import {axiosInstance} from '../lib/axios'
import {useAuthStore} from './useAuthStore'
export const useChatStore = create((set,get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({isUserLoading: true});
    try {
      const response = await axiosInstance.get('/messages/users');
      set({users: response.data,});
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      set({isUserLoading: false});
    }
  },
  getMessages: async (userId) => {
    set({isMessagesLoading: true});
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({messages: response.data});
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      set({isMessagesLoading: false});
    }
  },
  sendMessage: async (messageData) => {
    const{selectedUser,messages}=get();
    try {
      const response = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({messages: [...messages, response.data]});
    } catch (error) {
      toast.error('Failed to send message');
    }
  },
  subscribeToMessages: ()=>{
    const {selectedUser}=get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;

    socket.on('newMessage', (newMessage) => {
      const isMessageSentBySelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentBySelectedUser) return; // Ignore messages not from the selected user
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off('newMessage');
  },
  setSelectedUser: (selectedUser) => set({selectedUser}),
}));