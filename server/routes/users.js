const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        message: 'Invalid search query',
        details: 'Search query must be a non-empty string'
      });
    }

    // Sanitize the search query
    const sanitizedQuery = query.trim();
    
    if (sanitizedQuery.length < 2) {
      return res.status(400).json({
        message: 'Invalid search query',
        details: 'Search query must be at least 2 characters long'
      });
    }

    // Use parameterized query to prevent SQL injection
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`username.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      .neq('id', req.user.id) // Updated to use req.user.id
      .limit(10);

    if (error) {
      console.error('Supabase search error:', error);
      return res.status(500).json({
        message: 'Database search error',
        details: error.message
      });
    }

    if (!users) {
      return res.status(500).json({
        message: 'No results returned',
        details: 'Database query succeeded but returned no data'
      });
    }

    // Get friend requests for the current user
    const { data: sentRequests, error: requestError } = await supabase
      .from('friend_requests')
      .select('receiver_id, status')
      .eq('sender_id', req.user.id) // Updated to use req.user.id
      .eq('status', 'pending');

    if (requestError) {
      console.error('Friend requests error:', requestError);
      return res.status(500).json({
        message: 'Error fetching friend requests',
        details: requestError.message
      });
    }

    // Get existing friends to exclude them from results
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', req.user.id);

    if (friendsError) {
      console.error('Friends fetch error:', friendsError);
      return res.status(500).json({
        message: 'Error fetching friends list',
        details: friendsError.message
      });
    }

    // Create a set of friend IDs for faster lookup
    const friendIds = new Set(friends?.map(f => f.friend_id) || []);

    // Mark users who have pending friend requests and filter out existing friends
    const usersWithRequestStatus = users
      .filter(user => !friendIds.has(user.id))
      .map(user => ({
        ...user,
        requestSent: sentRequests?.some(request => request.receiver_id === user.id) || false
      }));

    res.json({
      users: usersWithRequestStatus,
      message: `Found ${usersWithRequestStatus.length} users`
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'Error searching users',
      details: error.message
    });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', req.user.id) // Updated to use req.user.id
      .single();

    if (userError) {
      console.error('Profile fetch error:', userError);
      return res.status(500).json({
        message: 'Error fetching user profile',
        details: userError.message
      });
    }

    if (!user) {
      return res.status(404).json({
        message: 'Profile not found',
        details: 'User profile does not exist'
      });
    }

    res.json({
      ...user,
      message: 'Profile fetched successfully'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      message: 'Error getting user profile',
      details: error.message
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (!username && !email) {
      return res.status(400).json({
        message: 'Invalid update',
        details: 'At least one field (username or email) must be provided'
      });
    }

    if (username) {
      if (typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({
          message: 'Invalid username',
          details: 'Username must be at least 3 characters long'
        });
      }
      updates.username = username.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: 'Invalid email',
          details: 'Please provide a valid email address'
        });
      }
      updates.email = email.trim();
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id) // Updated to use req.user.id
      .select('id, username, email')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        message: 'Error updating profile',
        details: error.message
      });
    }

    if (!user) {
      return res.status(404).json({
        message: 'Profile not found',
        details: 'User profile does not exist'
      });
    }

    res.json({
      ...user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      details: error.message
    });
  }
});

module.exports = router; 