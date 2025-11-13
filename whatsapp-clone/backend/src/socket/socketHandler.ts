import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

interface UserSocket extends Socket {
  userId?: string;
}

const userSockets = new Map<string, string>();

export const initializeSocket = (io: Server) => {
  io.use(async (socket: UserSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: UserSocket) => {
    console.log('User connected:', socket.userId);

    if (socket.userId) {
      userSockets.set(socket.userId, socket.id);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      io.emit('user-online', { userId: socket.userId });
    }

    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type, fileUrl, fileName } = data;

        const message = new Message({
          conversationId,
          senderId: socket.userId,
          content,
          type: type || 'text',
          fileUrl,
          fileName,
          status: 'sent',
        });

        await message.save();
        await message.populate('senderId', '-password');

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.lastMessage = message._id as any;
          conversation.updatedAt = new Date();
          await conversation.save();

          conversation.participants.forEach((participantId: any) => {
            const participantSocketId = userSockets.get(participantId.toString());
            if (participantSocketId) {
              io.to(participantSocketId).emit('receive-message', message);
            }
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing-start', (data) => {
      const { conversationId, userName } = data;
      socket.to(conversationId).emit('user-typing', { conversationId, userName });
    });

    socket.on('typing-stop', (data) => {
      const { conversationId } = data;
      socket.to(conversationId).emit('user-stop-typing', { conversationId });
    });

    socket.on('message-delivered', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findByIdAndUpdate(
          messageId,
          { status: 'delivered' },
          { new: true }
        );

        if (message) {
          const senderSocketId = userSockets.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-status-updated', {
              messageId,
              status: 'delivered',
            });
          }
        }
      } catch (error) {
        console.error('Message delivered error:', error);
      }
    });

    socket.on('message-read', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findByIdAndUpdate(
          messageId,
          { status: 'read' },
          { new: true }
        );

        if (message) {
          const senderSocketId = userSockets.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-status-updated', {
              messageId,
              status: 'read',
            });
          }
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.userId);

      if (socket.userId) {
        userSockets.delete(socket.userId);

        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit('user-offline', { userId: socket.userId });
      }
    });
  });
};
