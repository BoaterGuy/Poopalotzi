import express from 'express';
import { testEmailService } from './utils/email-service';

// Create a router for testing email functionality
const router = express.Router();

// Route to test email functionality
router.post('/api/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }
    
    const result = await testEmailService(email);
    
    if (result) {
      return res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email. Check server logs for details.' 
      });
    }
  } catch (error) {
    console.error('Error in test email route:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending test email' 
    });
  }
});

export default router;