import razorpayService from '../services/razorpayService.js';

export const getPaymentConfig = async (req, res) => {
  try {
    const keyId = razorpayService.getKeyId();
    res.json({
      success: true,
      keyId,
      currency: 'INR',
      name: 'VP Nuts',
      description: 'Premium Dry Fruits & Nutrient Seeds'
    });
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving payment configuration' });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const orderData = await razorpayService.createOrder({
      amount,
      receipt,
      notes
    });

    res.json(orderData);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating Razorpay order' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id and razorpay_payment_id are required'
      });
    }

    const verificationResult = razorpayService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (verificationResult.success && verificationResult.verified) {
      return res.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: verificationResult.paymentId,
        orderId: verificationResult.orderId,
        isMock: verificationResult.isMock
      });
    } else {
      return res.status(400).json({
        success: false,
        message: verificationResult.message || 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification' });
  }
};

