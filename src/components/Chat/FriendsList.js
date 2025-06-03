import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Avatar,
  Input,
  Button,
  useToast,
  Box,
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';

const FriendsList = ({ friends, selectedFriend, onSelectFriend }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(
        `http://localhost:4000/api/users/search?q=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSearchResults(response.data);
      setIsSearching(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(
        'http://localhost:4000/api/friends/request',
        { friendId: userId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      toast({
        title: 'Success',
        description: 'Friend request sent',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send friend request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={4} align="stretch" h="100%">
      <Text fontSize="xl" fontWeight="bold">
        Friends
      </Text>

      <HStack>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
        />
        <Button onClick={searchUsers}>Search</Button>
      </HStack>

      {isSearching && (
        <Box>
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Search Results
          </Text>
          <VStack align="stretch" spacing={2}>
            {searchResults.map((user) => (
              <HStack
                key={user._id}
                p={2}
                borderRadius="md"
                bg="gray.50"
                justify="space-between"
              >
                <HStack>
                  <Avatar size="sm" name={user.username} />
                  <Text>{user.username}</Text>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => sendFriendRequest(user._id)}
                >
                  Add Friend
                </Button>
              </HStack>
            ))}
          </VStack>
          <Divider my={4} />
        </Box>
      )}

      <VStack align="stretch" spacing={2} flex="1" overflowY="auto">
        {friends.map((friend) => (
          <HStack
            key={friend._id}
            p={2}
            borderRadius="md"
            bg={selectedFriend?._id === friend._id ? 'blue.100' : 'gray.50'}
            cursor="pointer"
            onClick={() => onSelectFriend(friend)}
            _hover={{ bg: 'blue.50' }}
          >
            <Avatar size="sm" name={friend.username} />
            <Text>{friend.username}</Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
};

export default FriendsList; 