const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  try {
    // Check if Authorization header exists and has correct format
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authorization header missing or invalid format',
        details: 'Header must be in format: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided',
        details: 'Token is required for authentication'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    } catch (jwtError) {
      console.error('JWT verification error:', {
        error: jwtError.message,
        token: token.substring(0, 10) + '...' // Log only first 10 chars for security
      });
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired',
          details: 'Please log in again'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token',
        details: 'Token verification failed'
      });
    }

    // Validate token payload
    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      return res.status(401).json({ 
        message: 'Invalid token format',
        details: 'Token payload is missing required fields'
      });
    }

    // Verify user exists in Supabase
    const { data: user, error: supabaseError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', decoded.userId)
      .single();

    if (supabaseError) {
      console.error('Supabase user verification error:', supabaseError);
      return res.status(401).json({ 
        message: 'Error verifying user',
        details: 'Database error during user verification'
      });
    }

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        details: 'Token refers to a non-existent user'
      });
    }

    // Add user data to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication failed',
      details: 'Internal server error during authentication'
    });
  }
}; 