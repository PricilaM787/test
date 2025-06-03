const router = require('express').Router();
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: 'Username, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (existingUserError) {
      console.error('Error checking existing user:', existingUserError);
      return res.status(500).json({
        message: 'Error checking existing user',
        details: 'Database error during user verification'
      });
    }

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
        details: 'Email or username is already taken'
      });
    }

    // Create new user using Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return res.status(500).json({
        message: 'Error creating user authentication',
        details: authError.message
      });
    }

    // Create user profile in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username,
          email,
        }
      ])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      return res.status(500).json({
        message: 'Error creating user profile',
        details: userError.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      userId: userData.id,
      username: userData.username,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error creating user',
      details: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: 'Email and password are required'
      });
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (authError) {
      console.error('Login error:', authError);
      return res.status(401).json({
        message: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return res.status(500).json({
        message: 'Error fetching user profile',
        details: userError.message
      });
    }

    if (!userData) {
      return res.status(404).json({
        message: 'User profile not found',
        details: 'User exists in auth but not in profile database'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userData.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userId: userData.id,
      username: userData.username,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in',
      details: error.message
    });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return res.status(500).json({
        message: 'Error signing out',
        details: error.message
      });
    }

    res.json({ message: 'Successfully signed out' });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      message: 'Error signing out',
      details: error.message
    });
  }
});

module.exports = router; 