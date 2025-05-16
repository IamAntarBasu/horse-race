const validateRegistration = (req, res, next) => {
  const { username, email, password, first_name, last_name, phone } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Optional fields validation
  if (first_name && first_name.length > 50) {
    errors.push('First name must be less than 50 characters');
  }

  if (last_name && last_name.length > 50) {
    errors.push('Last name must be less than 50 characters');
  }

  if (phone) {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      errors.push('Please provide a valid phone number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = {
  validateRegistration
}; 