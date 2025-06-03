import React from 'react';
import { VStack, HStack, Text, Box } from '@chakra-ui/react';

const MessageList = ({ messages, currentUserId }) => {
  return (
    <VStack spacing={4} align="stretch">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUserId;

        return (
          <HStack
            key={message._id}
            justify={isOwnMessage ? 'flex-end' : 'flex-start'}
          >
            <Box
              maxW="70%"
              bg={isOwnMessage ? 'blue.500' : 'gray.100'}
              color={isOwnMessage ? 'white' : 'black'}
              p={3}
              borderRadius="lg"
              position="relative"
            >
              <Text fontSize="sm">{message.content}</Text>
              <Text
                fontSize="xs"
                color={isOwnMessage ? 'blue.100' : 'gray.500'}
                position="absolute"
                bottom="-20px"
                right={isOwnMessage ? 0 : 'auto'}
                left={!isOwnMessage ? 0 : 'auto'}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </Box>
          </HStack>
        );
      })}
    </VStack>
  );
};

export default MessageList; 