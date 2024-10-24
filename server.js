const express = require('express');
const session = require('express-session');
const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

// Set up session handling
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Path for saving cron jobs to a file
const cronJobsFile = path.join(__dirname, 'cronJobsData.json');

let cronJobs = [];

// Load cron jobs from the file on server start
function loadCronJobs() {
    if (fs.existsSync(cronJobsFile)) {
        try {
            const data = fs.readFileSync(cronJobsFile, 'utf8');
            cronJobs = JSON.parse(data);

            // Recreate cron tasks from loaded jobs
            cronJobs.forEach((job) => {
                job.task = cron.schedule(`*/${job.minute} * * * *`, async () => {
                    try {
                        const response = await axios.get(job.url);  // Make the HTTP request
                        console.log(`Success: ${job.url} returned status ${response.status}`);
                    } catch (error) {
                        console.error(`Error hitting URL: ${job.url}, Message: ${error.message}`);
                    }
                });
            });

            console.log('Cron jobs loaded from file.');
        } catch (error) {
            console.error('Error loading cron jobs:', error);
        }
    }
}

// Save cron jobs to the file
function saveCronJobs() {
    const jobsToSave = cronJobs.map(({ task, ...rest }) => rest); // Remove `task` object
    try {
        fs.writeFileSync(cronJobsFile, JSON.stringify(jobsToSave, null, 2));
    } catch (error) {
        console.error('Error saving cron jobs:', error);
    }
}

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Serve static files from the public folder (but protect them with login)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Login endpoint (renders login page)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Handle login submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Simple login check (replace with real authentication)
    if (username === 'admin' && password === 'password') {
        req.session.isLoggedIn = true;
        res.redirect('/');
    } else {
        res.send('Invalid login! <a href="/login">Try again</a>');
    }
});

// Logout endpoint
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Apply the authentication middleware to all routes below this
app.use(isAuthenticated);

// Main cron job management page (protected by login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Endpoint to schedule the cron job (protected)
app.post('/schedule', (req, res) => {
    const { minute, url } = req.body;
    const cronExpression = `*/${minute} * * * *`;

    const newJob = {
        id: cronJobs.length > 0 ? cronJobs[cronJobs.length - 1].id + 1 : 1,
        url,
        minute
    };

    const task = cron.schedule(cronExpression, async () => {
        try {
            const response = await axios.get(url);  // Make the HTTP request
            console.log(`Success: ${url} returned status ${response.status}`);
        } catch (error) {
            console.error(`Error hitting URL: ${url}, Message: ${error.message}`);
        }
    });

    newJob.task = task;
    cronJobs.push(newJob);
    saveCronJobs(); // Save jobs after adding

    res.json(cronJobs.map(({ task, ...rest }) => rest)); // Remove circular references
});

// Endpoint to get all cron jobs (protected)
app.get('/jobs', (req, res) => {
    res.json(cronJobs.map(({ task, ...rest }) => rest)); // Remove task objects
});

// Endpoint to delete a cron job (protected)
app.delete('/jobs/:id', (req, res) => {
    const jobId = parseInt(req.params.id);
    const jobIndex = cronJobs.findIndex(job => job.id === jobId);

    if (jobIndex !== -1) {
        const job = cronJobs[jobIndex];
        job.task.stop();
        cronJobs.splice(jobIndex, 1);
        saveCronJobs(); // Save after deletion
    }

    res.json(cronJobs.map(({ task, ...rest }) => rest)); // Send updated job list
});

// Endpoint to update an existing cron job (protected)
app.put('/jobs/:id', (req, res) => {
    const jobId = parseInt(req.params.id);
    const { minute, url } = req.body;

    const jobIndex = cronJobs.findIndex(job => job.id === jobId);
    if (jobIndex !== -1) {
        const job = cronJobs[jobIndex];
        job.task.stop(); // Stop the current task

        // Update job details
        job.url = url;
        job.minute = minute;

        // Schedule a new task with updated details
        job.task = cron.schedule(`*/${minute} * * * *`, async () => {
            try {
                const response = await axios.get(url);  // Make the HTTP request
                console.log(`Success: ${url} returned status ${response.status}`);
            } catch (error) {
                console.error(`Error hitting URL: ${url}, Message: ${error.message}`);
            }
        });

        saveCronJobs(); // Save updated jobs
    }

    res.json({ success: true, message: 'Cron job updated successfully' });
});

// Start the server and load jobs
const port = 3000;
app.listen(port, () => {
    loadCronJobs(); // Load cron jobs on server start
    console.log(`Server is running on http://localhost:${port}`);
});
