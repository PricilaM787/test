-- Users table (managed by Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id),
  username text unique not null,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Friend requests table
create table if not exists public.friend_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid not null references public.users(id),
  receiver_id uuid not null references public.users(id),
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- Friends table (for accepted friendships)
create table if not exists public.friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.users(id),
  friend_id uuid not null references public.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid not null references public.users(id),
  receiver_id uuid not null references public.users(id),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

-- Create indexes for better query performance
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_id);
create index if not exists idx_friend_requests_receiver on public.friend_requests(receiver_id);
create index if not exists idx_friend_requests_status on public.friend_requests(status);
create index if not exists idx_friends_user on public.friends(user_id);
create index if not exists idx_friends_friend on public.friends(friend_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);

-- Add RLS (Row Level Security) policies
alter table public.users enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;
alter table public.messages enable row level security;

-- Users policies
create policy "Users can read all profiles"
  on public.users for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

-- Friend requests policies
create policy "Users can create friend requests"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "Users can read their own friend requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can update their received friend requests"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = receiver_id);

-- Friends policies
create policy "Users can read their friends"
  on public.friends for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can manage their friends"
  on public.friends for all
  to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Messages policies
create policy "Users can read their messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

-- Functions
create or replace function public.handle_friend_request_accepted()
returns trigger as $$
begin
  -- Create friendship records for both users
  insert into public.friends (user_id, friend_id)
  values
    (NEW.sender_id, NEW.receiver_id),
    (NEW.receiver_id, NEW.sender_id);
  return NEW;
end;
$$ language plpgsql security definer;

-- Triggers
create trigger on_friend_request_accepted
  after update of status on public.friend_requests
  for each row
  when (NEW.status = 'accepted')
  execute function public.handle_friend_request_accepted(); 