// Vercel Serverless Function - Email Handler
// api/send-email.js

const nodemailer = require('nodemailer');

// Create transporter with Gmail credentials from environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Helper function to send email
async function sendEmail(subject, htmlContent, recipientEmail) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

// Main handler
export default async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, email, fullName, title, phone, hospitalName, hospitalState, bedCount, departments, challenges, demoTime, attendees, additionalInfo } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (type === 'demo_booking') {
      // Demo booking form
      if (!fullName || !hospitalName) {
        return res.status(400).json({ error: 'Missing required fields: fullName, hospitalName' });
      }

      // Email to admin (onokwuruoscar101@gmail.com)
      const adminHtmlContent = `
        <h2>New Demo Booking Request</h2>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <h3>Personal Information</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Title:</strong> ${title || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        
        <h3>Hospital Information</h3>
        <p><strong>Hospital Name:</strong> ${hospitalName}</p>
        <p><strong>State:</strong> ${hospitalState || 'Not provided'}</p>
        <p><strong>Bed Count:</strong> ${bedCount || 'Not provided'}</p>
        
        <h3>Departments</h3>
        <p>${departments && departments.length > 0 ? departments.join(', ') : 'Not provided'}</p>
        
        <h3>Main Challenges</h3>
        <p>${challenges && challenges.length > 0 ? challenges.join(', ') : 'Not provided'}</p>
        
        <h3>Demo Preferences</h3>
        <p><strong>Preferred Time:</strong> ${demoTime || 'Not provided'}</p>
        <p><strong>Attendees:</strong> ${attendees || 'Not provided'}</p>
        
        <h3>Additional Information</h3>
        <p>${additionalInfo || 'None'}</p>
      `;

      // Email to user (confirmation)
      const userHtmlContent = `
        <h2>✓ Demo Booking Confirmed</h2>
        <p>Hello ${fullName},</p>
        
        <p>Thank you for booking a SmartCare demo! We're excited to show you how SmartCare can transform patient documentation at ${hospitalName}.</p>
        
        <h3>What to Expect</h3>
        <ul>
          <li><strong>Duration:</strong> 30-45 minutes</li>
          <li><strong>Format:</strong> Live walkthrough + Q&A</li>
          <li><strong>Demo Includes:</strong> Offline workflows, 60-second documentation, auto-sync</li>
          <li><strong>Next Steps:</strong> We'll call you within 24 hours to confirm your preferred time</li>
        </ul>
        
        <h3>Your Demo Details</h3>
        <p><strong>Hospital:</strong> ${hospitalName}</p>
        <p><strong>Contact Email:</strong> ${email}</p>
        <p><strong>Contact Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Preferred Time:</strong> ${demoTime}</p>
        <p><strong>Expected Attendees:</strong> ${attendees}</p>
        
        <p>If you have any questions before your demo, feel free to reach out.</p>
        
        <p>Best regards,<br>
        The SmartCare Team</p>
      `;

      // Send email to admin
      await sendEmail(
        `New Demo Booking - ${hospitalName}`,
        adminHtmlContent,
        'onokwuruoscar101@gmail.com'
      );

      // Send confirmation email to user
      await sendEmail(
        '✓ Demo Booking Confirmed - SmartCare',
        userHtmlContent,
        email
      );

      return res.status(200).json({
        statusCode: 200,
        body: JSON.stringify({
          message: "Thank you for booking a demo. We'll contact you within 24 hours.",
          type: 'demo_booking',
        }),
      });
    } else if (type === 'newsletter' || !type) {
      // Newsletter signup
      const adminHtmlContent = `
        <h2>New Newsletter Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `;

      const userHtmlContent = `
        <h2>✓ Welcome to SmartCare Updates</h2>
        <p>Thank you for subscribing to SmartCare updates!</p>
        <p>You'll be the first to know about:</p>
        <ul>
          <li>Early access releases</li>
          <li>Product updates & improvements</li>
          <li>Healthcare tips for small clinics</li>
          <li>Exclusive webinars</li>
        </ul>
        <p>Best regards,<br>
        The SmartCare Team</p>
      `;

      // Send to admin
      await sendEmail(
        'New Newsletter Signup',
        adminHtmlContent,
        'onokwuruoscar101@gmail.com'
      );

      // Send to user
      await sendEmail(
        '✓ Welcome to SmartCare',
        userHtmlContent,
        email
      );

      return res.status(200).json({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Check your email for early access!',
          type: 'newsletter',
        }),
      });
    }

    return res.status(400).json({ error: 'Invalid request type' });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
