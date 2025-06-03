import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import axios from 'axios';
import io from 'socket.io-client';
import FriendsList from './FriendsList';
import MessageList from './MessageList';

const Chat = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const toast = useToast();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message) => {
        if (selectedFriend && 
            (message.sender === selectedFriend._id || 
             message.receiver === selectedFriend._id)) {
          setMessages((prev) => [...prev, message]);
        } else {
          toast({
            title: 'New message',
            description: `New message from ${message.senderName}`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        }
      });
    }
  }, [socket, selectedFriend, toast]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/friends/list', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setFriends(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch friends list',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchFriends();
  }, [toast]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedFriend) {
        try {
          const response = await axios.get(
            `http://localhost:4000/api/messages/conversation/${selectedFriend._id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            }
          );
          setMessages(response.data);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch messages',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    };

    fetchMessages();
  }, [selectedFriend, toast]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const response = await axios.post(
        'http://localhost:4000/api/messages/send',
        {
          receiverId: selectedFriend._id,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      socket.emit('send_message', {
        ...response.data,
        senderName: localStorage.getItem('username'),
      });

      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Grid templateColumns="300px 1fr" h="100vh">
      <GridItem borderRight="1px" borderColor="gray.200" p={4}>
        <FriendsList
          friends={friends}
          selectedFriend={selectedFriend}
          onSelectFriend={setSelectedFriend}
        />
      </GridItem>

      <GridItem p={4}>
        {selectedFriend ? (
          <VStack h="100%" spacing={4}>
            <HStack w="100%" p={2} bg="gray.100" borderRadius="md">
              <Avatar size="sm" name={selectedFriend.username} />
              <Text fontWeight="bold">{selectedFriend.username}</Text>
            </HStack>

            <Box flex="1" w="100%" overflowY="auto">
              <MessageList
                messages={messages}
                currentUserId={localStorage.getItem('userId')}
              />
            </Box>

            <HStack w="100%">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button colorScheme="blue" onClick={sendMessage}>
                Send
              </Button>
            </HStack>
          </VStack>
        ) : (
          <Box
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.500"
          >
            Select a friend to start chatting
          </Box>
        )}
      </GridItem>
    </Grid>
  );
};

export default Chat; 