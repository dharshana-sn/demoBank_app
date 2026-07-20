import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Store KYC filenames in-memory by userId
const mockKycStatus = {};

// Expose uploaded files statically so the frontend can "View Document"
router.use('/files', express.static(uploadDir));

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const docType = req.body.documentType || 'unknown';
        cb(null, docType + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Pre-fill State Endpoint
router.get('/status', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!mockKycStatus[userId]) {
        mockKycStatus[userId] = { aadhar: null, pan: null, license: null };
    }
    res.json(mockKycStatus[userId]);
});

router.post('/upload', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const { documentType: docType, userId } = req.body;
        if (!userId) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'userId is required' });
        }

        if (!['aadhar', 'pan', 'license'].includes(docType)) {
            // Cleanup the file if invalid type
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid document type. Must be aadhar, pan, or license.' });
        }

        // Save successfully uploaded filename
        if (!mockKycStatus[userId]) {
            mockKycStatus[userId] = { aadhar: null, pan: null, license: null };
        }
        mockKycStatus[userId][docType] = req.file.filename;

        // Simulate processing delay for demo
        setTimeout(() => {
            res.json({
                success: true,
                message: `${docType.toUpperCase()} verified successfully.`,
                filename: req.file.filename,
                verificationId: `KYC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            });
        }, 1500);
    } catch (err) {
        console.error("KYC Upload Error:", err);
        res.status(500).json({ error: 'Failed to process document.' });
    }
});

// Delete Document Endpoint
router.delete('/document/:type', (req, res) => {
    const { type } = req.params;
    const { userId } = req.query;

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (!['aadhar', 'pan', 'license'].includes(type)) {
        return res.status(400).json({ error: 'Invalid document type.' });
    }

    if (!mockKycStatus[userId]) {
        return res.json({ success: true, message: 'Document deleted successfully' });
    }

    const filename = mockKycStatus[userId][type];
    if (filename) {
        const filepath = path.join(uploadDir, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        mockKycStatus[userId][type] = null;
    }

    res.json({ success: true, message: 'Document deleted successfully' });
});

export default router;
