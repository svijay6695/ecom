import store from '../services/store.js';
import otpService from '../services/otpService.js';

export const getDashboardStats = async (req, res) => {
  try {
    const stats = await store.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin stats' });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const users = await store.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve customers' });
  }
};

export const getActiveOtps = async (req, res) => {
  try {
    const otps = otpService.getAllOtps();
    res.json({
      success: true,
      count: otps.length,
      data: otps
    });
  } catch (error) {
    console.error('Error fetching active OTPs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve active OTPs' });
  }
};

export const clearOtps = async (req, res) => {
  try {
    otpService.clearAllOtps();
    res.json({
      success: true,
      message: 'All temporary OTP records cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing OTPs:', error);
    res.status(500).json({ success: false, message: 'Failed to clear OTPs' });
  }
};

export const deleteOtp = async (req, res) => {
  try {
    const { phone } = req.params;
    otpService.deleteOtp(phone);
    res.json({
      success: true,
      message: `OTP record for phone ${phone} removed successfully`
    });
  } catch (error) {
    console.error('Error deleting OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to delete OTP' });
  }
};

