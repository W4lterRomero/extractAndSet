require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// URL validation helper
function isValidVideoUrl(url) {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook proxy endpoint
app.post('/api/webhook', async (req, res) => {
    try {
        const { videoUrl, method = 'POST' } = req.body;

        // Validate video URL
        if (!videoUrl || !isValidVideoUrl(videoUrl)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid video URL provided'
            });
        }

        // Validate method
        const allowedMethods = ['GET', 'POST'];
        const httpMethod = method.toUpperCase();
        if (!allowedMethods.includes(httpMethod)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid HTTP method. Use GET or POST'
            });
        }

        // Check if webhook URL is configured
        if (!WEBHOOK_URL) {
            return res.status(503).json({
                success: false,
                error: 'Webhook URL not configured'
            });
        }

        // Make request to n8n webhook
        const config = {
            method: httpMethod,
            url: WEBHOOK_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (httpMethod === 'POST') {
            config.data = { videoUrl, timestamp: new Date().toISOString() };
        } else {
            config.params = { videoUrl };
        }

        const response = await axios(config);

        res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Webhook error:', error.message);

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                error: 'Request timeout - n8n webhook did not respond'
            });
        }

        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || 'Webhook request failed'
        });
    }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Webhook URL: ${WEBHOOK_URL || 'Not configured'}`);
});
