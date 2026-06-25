import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/index.js';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-secret-key-12345';

function hashPassword(password) {
  const salt = 'antigravity-salt-9876';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await db.findOne('users', u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = hashPassword(password);
    
    const newUser = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      preferences: {
        workingHoursStart: preferences?.workingHoursStart || '09:00',
        workingHoursEnd: preferences?.workingHoursEnd || '18:00',
        theme: preferences?.theme || 'dark',
        geminiApiKey: preferences?.geminiApiKey || ''
      },
      createdAt: new Date().toISOString()
    };

    await db.insert('users', newUser);

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findOne('users', u => u.email === email.toLowerCase());
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

export default router;
