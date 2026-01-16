const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const tester = require('./services/tester');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files (screenshots)
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.post('/api/test', async (req, res) => {
    try {
        const { url, routes, requiresAuth, mobile, password, customHeaders } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        console.log(`Starting test for: ${url} with routes: ${routes || '/'}`);
        if (requiresAuth) {
            console.log('Authentication enabled - will perform automatic login');
        }

        const report = await tester.testWebsite(url, routes, { requiresAuth, mobile, password, customHeaders });
        res.json(report);
    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const reports = await tester.getReports();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/:id', async (req, res) => {
    try {
        const report = await tester.getReport(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports/:id/download', async (req, res) => {
    try {
        const archiver = require('archiver');
        const report = await tester.getReport(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const archive = archiver('zip', { zlib: { level: 9 } });

        res.attachment(`report-${req.params.id}.zip`);
        archive.pipe(res);

        // Add report JSON
        const reportPath = path.join(__dirname, 'public/results', `report-${req.params.id}.json`);
        if (await fs.pathExists(reportPath)) {
            archive.file(reportPath, { name: 'report.json' });
        } else {
            // Try old format
            const oldReportPath = path.join(__dirname, 'public/results', `report - ${req.params.id}.json`);
            if (await fs.pathExists(oldReportPath)) {
                archive.file(oldReportPath, { name: 'report.json' });
            }
        }

        // Add all screenshots from the run directory
        const runDir = path.join(__dirname, 'public/runs', req.params.id);
        if (await fs.pathExists(runDir)) {
            archive.directory(runDir, 'screenshots/runs');
        }

        // Add baseline screenshots for this site
        if (report.site) {
            const baselineDir = path.join(__dirname, 'public/baselines', report.site);
            if (await fs.pathExists(baselineDir)) {
                archive.directory(baselineDir, 'screenshots/baselines');
            }
        }

        await archive.finalize();
    } catch (error) {
        console.error('Download failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reports/:id', async (req, res) => {
    try {
        const result = await tester.deleteReport(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes Management
app.get('/api/routes/:domain', async (req, res) => {
    try {
        const routesFile = path.join(__dirname, 'public/routes.json');
        let routesData = {};

        if (await fs.pathExists(routesFile)) {
            routesData = await fs.readJson(routesFile);
        }

        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        res.json(routesData[domain] || ['/']);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/routes/:domain', async (req, res) => {
    try {
        const routesFile = path.join(__dirname, 'public/routes.json');
        let routesData = {};

        if (await fs.pathExists(routesFile)) {
            routesData = await fs.readJson(routesFile);
        }

        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        const { route } = req.body;

        if (!routesData[domain]) {
            routesData[domain] = ['/'];
        }

        if (!routesData[domain].includes(route)) {
            routesData[domain].push(route);
        }

        await fs.writeJson(routesFile, routesData, { spaces: 2 });
        res.json(routesData[domain]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Baseline Management
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.get('/api/baselines/:domain', async (req, res) => {
    try {
        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        const baseBaselineDir = path.join(__dirname, 'public/baselines', domain);

        if (!(await fs.pathExists(baseBaselineDir))) {
            return res.json([]);
        }

        const baselines = [];
        const states = ['logged-in', 'logged-out'];

        for (const state of states) {
            const stateDir = path.join(baseBaselineDir, state);
            if (await fs.pathExists(stateDir)) {
                const files = await fs.readdir(stateDir);
                baselines.push(...files.filter(f => f.endsWith('.png')).map(f => ({
                    filename: f,
                    state: state,
                    path: `baselines/${domain}/${state}/${f}`
                })));
            }
        }

        res.json(baselines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/baselines/upload', upload.single('image'), async (req, res) => {
    try {
        let { domain, routeName, viewport, authState } = req.body;

        if (!req.file || !domain || !routeName || !viewport) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        authState = authState || 'logged-out';

        // Sanitize domain: Extract hostname if it's a URL, and remove invalid path characters
        try {
            if (domain.includes('://')) {
                domain = new URL(domain).hostname;
            }
        } catch (e) {
            // Not a valid URL, just sanitize string
        }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        const baselineDir = path.join(__dirname, 'public/baselines', domain, authState);
        await fs.ensureDir(baselineDir);

        const filename = `${routeName}-${viewport.toLowerCase()}-fullpage.png`;
        const destPath = path.join(baselineDir, filename);

        await fs.move(req.file.path, destPath, { overwrite: true });

        res.json({
            success: true,
            filename,
            authState,
            path: `baselines/${domain}/${authState}/${filename}`
        });
    } catch (error) {
        console.error('Upload failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/baselines/:domain/:state/:filename', async (req, res) => {
    try {
        let { domain, state, filename } = req.params;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        const filePath = path.join(__dirname, 'public/baselines', domain, state, filename);

        if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Baseline not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Authentication Management
app.get('/api/auth/:domain', async (req, res) => {
    try {
        const authFile = path.join(__dirname, 'public/auth.json');
        let authData = {};

        if (await fs.pathExists(authFile)) {
            authData = await fs.readJson(authFile);
        }

        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        res.json(authData[domain] || { requiresAuth: false, bearerToken: '', customHeaders: {} });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/:domain', async (req, res) => {
    try {
        const authFile = path.join(__dirname, 'public/auth.json');
        let authData = {};

        if (await fs.pathExists(authFile)) {
            authData = await fs.readJson(authFile);
        }

        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        const { requiresAuth, bearerToken, customHeaders } = req.body;

        authData[domain] = {
            requiresAuth: requiresAuth || false,
            bearerToken: bearerToken || '',
            customHeaders: customHeaders || {}
        };

        await fs.writeJson(authFile, authData, { spaces: 2 });
        res.json(authData[domain]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/auth/:domain', async (req, res) => {
    try {
        const authFile = path.join(__dirname, 'public/auth.json');
        let authData = {};

        if (await fs.pathExists(authFile)) {
            authData = await fs.readJson(authFile);
        }

        let domain = req.params.domain;
        try {
            if (domain.includes('://')) domain = new URL(domain).hostname;
        } catch (e) { }
        domain = domain.replace(/[:\\/*?"<>|]/g, '_');

        if (authData[domain]) {
            delete authData[domain];
            await fs.writeJson(authFile, authData, { spaces: 2 });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Error handlers to catch and log issues without crashing silently
process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the existing process.`);
    } else {
        console.error('Server failed to start:', error);
    }
});
