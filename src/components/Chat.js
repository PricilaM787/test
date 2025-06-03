import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Text,
  Flex,
  Button,
  Spinner,
} from '@chakra-ui/react';
import Search from './Search';
import axios from 'axios';

const Chat = () => {
  const [friendRequests, setFriendRequests] = useState({
    received: [],
    sent: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:4000/api/friends/requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFriendRequests({
        received: response.data.received || [],
        sent: response.data.sent || []
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch friend requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      // Initialize with empty arrays if there's an error
      setFriendRequests({ received: [], sent: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await axios.put(
        `http://localhost:4000/api/friends/request/${requestId}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      toast({
        title: 'Success',
        description: `Friend request ${status}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh friend requests
      fetchFriendRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${status} friend request`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={4}>
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns="repeat(12, 1fr)" gap={6}>
        {/* Left sidebar for search and friend requests */}
        <GridItem colSpan={4}>
          <Tabs>
            <TabList>
              <Tab>Search</Tab>
              <Tab>Requests ({(friendRequests.received || []).length})</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0} pt={4}>
                <Search onFriendRequestSent={fetchFriendRequests} />
              </TabPanel>
              <TabPanel p={0} pt={4}>
                <Box bg="white" p={4} borderRadius="lg" shadow="md">
                  <Tabs size="sm">
                    <TabList>
                      <Tab>Received ({(friendRequests.received || []).length})</Tab>
                      <Tab>Sent ({(friendRequests.sent || []).length})</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        {friendRequests.received.map((request) => (
                          <Box
                            key={request.id}
                            p={3}
                            borderWidth={1}
                            borderRadius="md"
                            mb={2}
                          >
                            <Box>
                              <Text fontWeight="bold">{request.sender.username}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {request.sender.email}
                              </Text>
                            </Box>
                            <Flex mt={2} gap={2}>
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleRequestAction(request.id, 'accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleRequestAction(request.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </Flex>
                          </Box>
                        ))}
                        {friendRequests.received.length === 0 && (
                          <Text color="gray.500" textAlign="center">
                            No pending requests
                          </Text>
                        )}
                      </TabPanel>
                      <TabPanel>
                        {friendRequests.sent.map((request) => (
                          <Box
                            key={request.id}
                            p={3}
                            borderWidth={1}
                            borderRadius="md"
                            mb={2}
                          >
                            <Text fontWeight="bold">{request.receiver.username}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {request.receiver.email}
                            </Text>
                          </Box>
                        ))}
                        {friendRequests.sent.length === 0 && (
                          <Text color="gray.500" textAlign="center">
                            No sent requests
                          </Text>
                        )}
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>

        {/* Main chat area */}
        <GridItem colSpan={8}>
          <Box bg="white" p={6} borderRadius="lg" shadow="md" height="full">
            <Text>Chat functionality coming soon...</Text>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default Chat; 