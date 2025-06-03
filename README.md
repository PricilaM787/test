# Chat Application

A real-time chat application with user authentication, friend management, and private messaging functionality.

## Features

- User registration and authentication
- Friend management (add friends, accept friend requests)
- Real-time private messaging
- Modern and responsive UI using Chakra UI
- Secure authentication using JWT and Supabase
- Supabase PostgreSQL database
- Socket.IO for real-time communication

## Prerequisites

- Node.js (v14 or higher)
- Supabase account (free tier available)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Set up Supabase:
   - Create a new project at https://supabase.com
   - Create the following tables in your Supabase database:
     ```sql
     -- Users table
     create table public.users (
       id uuid references auth.users not null primary key,
       username text not null unique,
       email text not null unique,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );

     -- Friends table
     create table public.friends (
       id uuid default uuid_generate_v4() primary key,
       user_id uuid references public.users not null,
       friend_id uuid references public.users not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       unique(user_id, friend_id)
     );

     -- Friend requests table
     create table public.friend_requests (
       id uuid default uuid_generate_v4() primary key,
       sender_id uuid references public.users not null,
       receiver_id uuid references public.users not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null,
       unique(sender_id, receiver_id)
     );

     -- Messages table
     create table public.messages (
       id uuid default uuid_generate_v4() primary key,
       sender_id uuid references public.users not null,
       receiver_id uuid references public.users not null,
       content text not null,
       read boolean default false,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );
     ```

5. Create a `.env` file in the server directory with the following content:
```
PORT=4000
JWT_SECRET=your_jwt_secret_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend development server:
```bash
cd ..  # Go back to the root directory
npm start
```

The frontend application will be available at `http://localhost:3000`
The backend server will be running at `http://localhost:4000`

## Usage

1. Register a new account or login with existing credentials
2. Search for other users and send friend requests
3. Accept friend requests to start chatting
4. Click on a friend in the friends list to start a conversation
5. Messages are delivered in real-time

## Technologies Used

- Frontend:
  - React
  - Chakra UI
  - Socket.IO Client
  - Axios
  - React Router

- Backend:
  - Node.js
  - Express
  - Supabase (PostgreSQL)
  - Socket.IO
  - JSON Web Tokens

## Security Features

- Secure authentication with Supabase Auth
- JWT-based API authentication
- Protected API routes
- Secure WebSocket connections
- Row Level Security in Supabase

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
