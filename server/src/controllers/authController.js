const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const userData = req.body;
      const user = await authService.register(userData);
      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const credentials = req.body;
      const result = await authService.login(credentials);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No token provided');
      }
      const user = await authService.verifyToken(token);
      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
}

module.exports = new AuthController(); 