const express = require('express');
const session = require('express-session');
const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Generate a random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

// Configure session middleware
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Path to the file where cron jobs are saved
const cronJobsFile = path.join(__dirname, 'cronJobsData.json');

// Initialize an empty array to hold cron jobs
let cronJobs = [];

// Load cron jobs from file and schedule them on server start
function loadCronJobs() {
    if (fs.existsSync(cronJobsFile)) {
        try {
            const data = fs.readFileSync(cronJobsFile, 'utf8');
            cronJobs = JSON.parse(data);

            cronJobs.forEach((job) => {
                scheduleCronJob(job);
            });

            console.log('Cron jobs loaded and scheduled.');
        } catch (error) {
            console.error('Error loading cron jobs:', error);
        }
    }
}

// Save all cron jobs to the JSON file
function saveCronJobs() {
    const jobsToSave = cronJobs.map(({ task, ...rest }) => rest); // Remove task objects for saving
    try {
        fs.writeFileSync(cronJobsFile, JSON.stringify(jobsToSave, null, 2));
    } catch (error) {
        console.error('Error saving cron jobs:', error);
    }
}

// Schedule a cron job based on its configuration
function scheduleCronJob(job) {
    job.task = cron.schedule(`*/${job.minute} * * * *`, async () => {
        try {
            const response = await axios.get(job.url);
            console.log(`Success: ${job.url} returned status ${response.status}`);
        } catch (error) {
            console.error(`Error hitting URL: ${job.url}, Message: ${error.message}`);
        }
    });
}

// Route to serve the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Handle login submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Test@162$$') { // updated password
        req.session.isLoggedIn = true;
        res.redirect('/');
    } else {
        res.send('Invalid login! <a href="/login">Try again</a>');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Main page route (only accessible if logged in)
app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Get all cron jobs
app.get('/jobs', isAuthenticated, (req, res) => {
    res.json(cronJobs.map(({ task, ...rest }) => rest)); // Send all jobs without task objects
});

// Add a new cron job
app.post('/schedule', isAuthenticated, (req, res) => {
    const { name = 'Untitled', description = 'No description', minute, url } = req.body;
    const newJob = {
        id: cronJobs.length > 0 ? cronJobs[cronJobs.length - 1].id + 1 : 1,
        name,
        description,
        url,
        minute
    };

    // Schedule the new job and add it to the list
    scheduleCronJob(newJob);
    cronJobs.push(newJob);
    saveCronJobs(); // Save to file

    res.json(cronJobs.map(({ task, ...rest }) => rest)); // Return updated job list
});

// Update an existing cron job
app.put('/jobs/:id', isAuthenticated, (req, res) => {
    const jobId = parseInt(req.params.id);
    const { name, description, minute, url } = req.body;
    const jobIndex = cronJobs.findIndex(job => job.id === jobId);

    if (jobIndex !== -1) {
        // Stop the existing task
        cronJobs[jobIndex].task.stop();

        // Update job details
        cronJobs[jobIndex].name = name;
        cronJobs[jobIndex].description = description;
        cronJobs[jobIndex].url = url;
        cronJobs[jobIndex].minute = minute;

        // Reschedule the updated job
        scheduleCronJob(cronJobs[jobIndex]);
        saveCronJobs(); // Save to file

        res.json({ success: true, message: 'Cron job updated successfully' });
    } else {
        res.status(404).json({ error: 'Cron job not found' });
    }
});

// Delete a cron job
app.delete('/jobs/:id', isAuthenticated, (req, res) => {
    const jobId = parseInt(req.params.id);
    const jobIndex = cronJobs.findIndex(job => job.id === jobId);

    if (jobIndex !== -1) {
        // Stop the task before deleting it
        cronJobs[jobIndex].task.stop();

        // Remove job from the list and save to file
        cronJobs.splice(jobIndex, 1);
        saveCronJobs();

        res.json({ success: true, message: 'Cron job deleted successfully' });
    } else {
        res.status(404).json({ error: 'Cron job not found' });
    }
});

// Start the server and load cron jobs on start
app.listen(port, () => {
    loadCronJobs(); // Load and schedule jobs on server start
    console.log(`Server is running on http://localhost:${port}`);
});
