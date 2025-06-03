import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.200');

  const handleSignOut = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/signout');
      // Clear user data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box bg={bgColor} px={4} py={4} shadow="lg">
      <Flex maxW="container.xl" mx="auto" justify="space-between" align="center">
        <Link
          as={RouterLink}
          to="/chat"
          fontSize="xl"
          fontWeight="bold"
          color={textColor}
          _hover={{ textDecoration: 'none', opacity: 0.8 }}
        >
          Chat App
        </Link>
        <Flex align="center" gap={4}>
          <Text color="gray.300">Welcome, {username || 'User'}</Text>
          <Button
            colorScheme="red"
            onClick={handleSignOut}
            size="md"
          >
            Sign Out
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 