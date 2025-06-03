import React, { useState } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  Button,
  useToast,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Search = ({ onFriendRequestSent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to continue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
      return false;
    }
    return token;
  };

  const handleSearch = async () => {
    // Clear previous error state
    setError(null);
    
    // Validate search term
    if (!searchTerm || !searchTerm.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search term',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length < 2) {
      toast({
        title: 'Error',
        description: 'Search term must be at least 2 characters long',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const token = checkAuthentication();
    if (!token) return;
    
    setIsLoading(true);
    setSearchResults([]);
    
    try {
      const response = await axios.get(
        `http://localhost:4000/api/users/search?query=${encodeURIComponent(trimmedSearch)}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.users) {
        setSearchResults(response.data.users);
        if (response.data.message) {
          toast({
            title: 'Success',
            description: response.data.message,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
      } else {
        setSearchResults([]);
        toast({
          title: 'No Results',
          description: 'No users found matching your search',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Search error:', error.response || error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to search users';
      setError(errorMessage);
      
      toast({
        title: 'Search Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    const token = checkAuthentication();
    if (!token) return;

    try {
      await axios.post(
        'http://localhost:4000/api/friends/request',
        { receiverId: userId },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Friend request sent!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update the search results to show the request was sent
      setSearchResults(results =>
        results.map(user =>
          user.id === userId ? { ...user, requestSent: true } : user
        )
      );

      // Notify parent component to refresh friend requests
      if (onFriendRequestSent) {
        onFriendRequestSent();
      }
    } catch (error) {
      console.error('Friend request error:', error.response || error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const errorMessage = error.response?.data?.details || error.response?.data?.message || 'Failed to send friend request';
      
      toast({
        title: 'Friend Request Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} bg="white" borderRadius="lg" shadow="md">
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search users by username or email (min. 2 characters)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
      </InputGroup>

      <Button
        colorScheme="blue"
        width="full"
        onClick={handleSearch}
        isLoading={isLoading}
        mb={4}
        disabled={!searchTerm.trim() || searchTerm.trim().length < 2}
      >
        {isLoading ? 'Searching...' : 'Search'}
      </Button>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Flex justify="center" align="center" py={8}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : (
        <VStack spacing={3} align="stretch">
          {searchResults.map((user) => (
            <Flex
              key={user.id}
              justify="space-between"
              align="center"
              p={3}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
              _hover={{ bg: 'gray.100' }}
            >
              <Box>
                <Text fontWeight="bold">{user.username}</Text>
                <Text fontSize="sm" color="gray.500">{user.email}</Text>
              </Box>
              <Button
                colorScheme={user.requestSent ? 'gray' : 'green'}
                size="sm"
                onClick={() => !user.requestSent && sendFriendRequest(user.id)}
                disabled={user.requestSent}
                _hover={{ opacity: 0.8 }}
              >
                {user.requestSent ? 'Request Sent' : 'Add Friend'}
              </Button>
            </Flex>
          ))}
          {searchResults.length === 0 && searchTerm && !isLoading && !error && (
            <Text color="gray.500" textAlign="center" py={4}>
              No users found matching your search
            </Text>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default Search; 