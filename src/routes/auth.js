import express from 'express';
import { loginUser } from '../services/userService';
import { validateLogin } from '../validators/loginValidator';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    validateLogin({ username, password });

    const user = await loginUser(username, password);

    res.json({ message: 'Login successful', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
