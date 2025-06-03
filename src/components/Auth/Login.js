import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clear any existing tokens
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');

      const response = await axios.post('http://localhost:4000/api/auth/login', {
        email: email.trim(),
        password: password.trim()
      });

      // Verify we have all required data
      const { token, userId, username } = response.data;
      if (!token || !userId || !username) {
        throw new Error('Invalid response from server');
      }

      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('username', username);

      // Configure axios defaults for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      toast({
        title: 'Login successful',
        description: `Welcome back, ${username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/chat');
    } catch (error) {
      console.error('Login error:', error.response || error);
      
      // Clear any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid credentials',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius={8} bg="white">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Text fontSize="2xl" fontWeight="bold">
          Login
        </Text>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
          loadingText="Logging in..."
        >
          Login
        </Button>

        <Text>
          Don't have an account?{' '}
          <Button
            variant="link"
            colorScheme="blue"
            onClick={() => navigate('/register')}
          >
            Register
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login; 