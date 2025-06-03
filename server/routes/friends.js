const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({
        message: 'Missing required field',
        details: 'receiverId is required'
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        message: 'Invalid request',
        details: 'Cannot send friend request to yourself'
      });
    }

    // Check if users are already friends
    const { data: existingFriendship, error: friendshipError } = await supabase
      .from('friends')
      .select('id')
      .or(`and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`)
      .maybeSingle();

    if (friendshipError) {
      console.error('Friendship check error:', friendshipError);
      return res.status(500).json({
        message: 'Error checking friendship status',
        details: friendshipError.message
      });
    }

    if (existingFriendship) {
      return res.status(400).json({
        message: 'Invalid request',
        details: 'Users are already friends'
      });
    }

    // Check if request already exists
    const { data: existingRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError) {
      console.error('Request check error:', requestError);
      return res.status(500).json({
        message: 'Error checking existing requests',
        details: requestError.message
      });
    }

    if (existingRequest) {
      return res.status(400).json({
        message: 'Request already exists',
        details: 'A pending friend request already exists between these users'
      });
    }

    // Create friend request
    const { data: newRequest, error: createError } = await supabase
      .from('friend_requests')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Create request error:', createError);
      return res.status(500).json({
        message: 'Error creating friend request',
        details: createError.message
      });
    }

    res.status(201).json({
      message: 'Friend request sent successfully',
      request: newRequest
    });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({
      message: 'Error sending friend request',
      details: error.message
    });
  }
});

// Get friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get received requests
    const { data: receivedRequests, error: receivedError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        sender:sender_id (
          id,
          username,
          email
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (receivedError) {
      console.error('Received requests error:', receivedError);
      return res.status(500).json({
        message: 'Error fetching received requests',
        details: receivedError.message
      });
    }

    // Get sent requests
    const { data: sentRequests, error: sentError } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        receiver:receiver_id (
          id,
          username,
          email
        )
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (sentError) {
      console.error('Sent requests error:', sentError);
      return res.status(500).json({
        message: 'Error fetching sent requests',
        details: sentError.message
      });
    }

    res.json({
      received: receivedRequests || [],
      sent: sentRequests || [],
      message: 'Friend requests fetched successfully'
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      message: 'Error getting friend requests',
      details: error.message
    });
  }
});

// Accept/Reject friend request
router.put('/request/:requestId', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
        details: 'Status must be either "accepted" or "rejected"'
      });
    }

    // Verify the request exists and is for this user
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestError) {
      console.error('Request verification error:', requestError);
      return res.status(500).json({
        message: 'Error verifying friend request',
        details: requestError.message
      });
    }

    if (!request) {
      return res.status(404).json({
        message: 'Request not found',
        details: 'Friend request not found or already processed'
      });
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Status update error:', updateError);
      return res.status(500).json({
        message: 'Error updating request status',
        details: updateError.message
      });
    }

    // If accepted, friendship records will be created by the trigger
    res.json({
      message: `Friend request ${status}`,
      status,
      requestId
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      message: 'Error updating friend request',
      details: error.message
    });
  }
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: friends, error } = await supabase
      .from('friends')
      .select(`
        friend:friend_id (
          id,
          username,
          email
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Friends list error:', error);
      return res.status(500).json({
        message: 'Error fetching friends list',
        details: error.message
      });
    }

    res.json({
      friends: friends.map(f => f.friend),
      message: `Found ${friends.length} friends`
    });
  } catch (error) {
    console.error('Friends list error:', error);
    res.status(500).json({
      message: 'Error getting friends list',
      details: error.message
    });
  }
});

module.exports = router; 