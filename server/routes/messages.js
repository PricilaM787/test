const router = require('express').Router();
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Send message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    // Create new message
    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: req.userId,
          receiver_id: receiverId,
          content
        }
      ])
      .select(`
        *,
        sender:sender_id (username),
        receiver:receiver_id (username)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get conversation history
router.get('/conversation/:friendId', auth, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (username),
        receiver:receiver_id (username)
      `)
      .or(`and(sender_id.eq.${req.userId},receiver_id.eq.${req.params.friendId}),and(sender_id.eq.${req.params.friendId},receiver_id.eq.${req.userId})`)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error getting messages', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:friendId', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .match({
        sender_id: req.params.friendId,
        receiver_id: req.userId,
        read: false
      });

    if (error) {
      throw error;
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

module.exports = router; 