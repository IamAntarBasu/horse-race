const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

class AuthService {
  async register(userData) {
    const { username, email, password, first_name, last_name, phone } = userData;
    
    // Check if user already exists
    const existingUser = await db('users')
      .where({ email })
      .orWhere({ username })
      .first();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const [newUser] = await db('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        first_name,
        last_name,
        phone,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning(['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'created_at']);

    // Create initial balance row for the new user
    await db('balance').insert({
      user_id: newUser.id,
      balance: 0,
      exposure: 0,
      previousbalance: 0,
      previousexposure: 0,
      balance_updated_at: db.fn.now()
    });

    return newUser;
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await db('users')
      .where({ email })
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login: db.fn.now() });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    };
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if user still exists
      const user = await db('users')
        .select(['id', 'username', 'email', 'role', 'is_active'])
        .where({ id: decoded.id })
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService(); 