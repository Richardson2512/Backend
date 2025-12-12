const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const router = express.Router();

// Store uploads in memory (so we can attach them to email)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024, // 5 MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed as screenshots.'));
    }
  },
});

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

// POST /api/support/contact
// Accepts multipart/form-data with fields: name, email, type, message, and files: screenshots[]
router.post('/contact', upload.array('screenshots', 5), async (req, res) => {
  try {
    const { name, email, type, message } = req.body || {};
    const screenshots = req.files || [];

    if (!name || !email || !type || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide name, email, type, and message.',
      });
    }

    const transport = getTransport();
    if (!transport) {
      return res.status(500).json({
        success: false,
        error: 'Email not configured',
        message:
          'SMTP is not configured on the server. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optional SMTP_SECURE).',
      });
    }

    const to = process.env.SUPPORT_EMAIL_TO || 'contact@insightsnap.co';
    const from =
      process.env.SUPPORT_EMAIL_FROM ||
      process.env.SMTP_FROM ||
      `InsightSnap Support <${process.env.SMTP_USER}>`;

    const subject =
      type === 'issue'
        ? `🐛 Bug Report (with screenshots: ${screenshots.length}) - ${email}`
        : `💬 Feedback - ${email}`;

    const textBody = [
      `Type: ${type}`,
      `Name: ${name}`,
      `Email: ${email}`,
      '',
      'Message:',
      message,
      '',
      screenshots.length > 0 ? `Screenshots attached: ${screenshots.length}` : 'No screenshots attached.',
    ].join('\n');

    // Build inline (CID) attachments so screenshots render inside the email body
    const cidAttachments = screenshots.map((file, idx) => {
      const cid = `screenshot-${idx + 1}@insightsnap`;
      return {
        filename: file.originalname || `screenshot-${idx + 1}.png`,
        content: file.buffer,
        contentType: file.mimetype,
        cid,
        contentDisposition: 'inline',
      };
    });

    // Escape message for safe HTML rendering
    const escapeHtml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const htmlScreenshotsSection =
      cidAttachments.length > 0
        ? `
          <h3 style="margin:16px 0 8px;">Screenshots</h3>
          ${cidAttachments
            .map(
              (att, i) => `
                <div style="margin:10px 0;">
                  <div style="font-size:12px;color:#555;margin-bottom:6px;">
                    ${i + 1}. ${escapeHtml(att.filename)}
                  </div>
                  <img src="cid:${att.cid}" alt="${escapeHtml(att.filename)}"
                       style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px;" />
                </div>`
            )
            .join('')}
        `
        : `<p><em>No screenshots attached.</em></p>`;

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;color:#111;">
        <p><strong>Type:</strong> ${escapeHtml(type)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <h3 style="margin:0 0 8px;">Message</h3>
        <pre style="white-space:pre-wrap;background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:8px;">${escapeHtml(
          message
        )}</pre>
        ${htmlScreenshotsSection}
      </div>
    `;

    await transport.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: cidAttachments,
    });

    logger.info('✅ Support message sent', {
      type,
      fromEmail: email,
      screenshots: screenshots.length,
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error('❌ Failed to send support message', {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
      message: err.message || 'Unknown error',
    });
  }
});

module.exports = router;


