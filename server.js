const express = require('express');
const session = require('express-session');
const cron = require('node-cron');
const axios = require('axios');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Import crypto module for generating session secret

const app = express();

// Generate a random session secret
const sessionSecret = crypto.randomBytes(32).toString('hex');

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cronJobsFile = path.join(__dirname, 'cronJobsData.json');

let cronJobs = [];

// Load cron jobs from file on server start
function loadCronJobs() {
    if (fs.existsSync(cronJobsFile)) {
        try {
            const data = fs.readFileSync(cronJobsFile, 'utf8');
            cronJobs = JSON.parse(data);

            cronJobs.forEach((job) => {
                job.task = cron.schedule(`*/${job.minute} * * * *`, async () => {
                    try {
                        const response = await axios.get(job.url);
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

// Save cron jobs to file
function saveCronJobs() {
    const jobsToSave = cronJobs.map(({ task, ...rest }) => rest);
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

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        req.session.isLoggedIn = true;
        res.redirect('/');
    } else {
        res.send('Invalid login! <a href="/login">Try again</a>');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.use(isAuthenticated);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Endpoint to schedule a cron job
app.post('/schedule', (req, res) => {
    const { name = 'Untitled', description = 'No description', minute, url } = req.body;
    const cronExpression = `*/${minute} * * * *`;

    const newJob = {
        id: cronJobs.length > 0 ? cronJobs[cronJobs.length - 1].id + 1 : 1,
        name,
        description,
        url,
        minute
    };

    const task = cron.schedule(cronExpression, async () => {
        try {
            const response = await axios.get(url);
            console.log(`Success: ${url} returned status ${response.status}`);
        } catch (error) {
            console.error(`Error hitting URL: ${url}, Message: ${error.message}`);
        }
    });

    newJob.task = task;
    cronJobs.push(newJob);
    saveCronJobs();

    res.json(cronJobs.map(({ task, ...rest }) => rest));
});

app.get('/jobs', (req, res) => {
    res.json(cronJobs.map(({ task, ...rest }) => rest));
});

app.delete('/jobs/:id', (req, res) => {
    const jobId = parseInt(req.params.id);
    const jobIndex = cronJobs.findIndex(job => job.id === jobId);

    if (jobIndex !== -1) {
        const job = cronJobs[jobIndex];
        job.task.stop();
        cronJobs.splice(jobIndex, 1);
        saveCronJobs();
    }

    res.json(cronJobs.map(({ task, ...rest }) => rest));
});

app.put('/jobs/:id', (req, res) => {
    const jobId = parseInt(req.params.id);
    const { name = 'Untitled', description = 'No description', minute, url } = req.body;

    const jobIndex = cronJobs.findIndex(job => job.id === jobId);
    if (jobIndex !== -1) {
        const job = cronJobs[jobIndex];
        job.task.stop();

        job.name = name;
        job.description = description;
        job.url = url;
        job.minute = minute;

        job.task = cron.schedule(`*/${minute} * * * *`, async () => {
            try {
                const response = await axios.get(url);
                console.log(`Success: ${url} returned status ${response.status}`);
            } catch (error) {
                console.error(`Error hitting URL: ${url}, Message: ${error.message}`);
            }
        });

        saveCronJobs();
    }

    res.json({ success: true, message: 'Cron job updated successfully' });
});

const port = 3000;
app.listen(port, () => {
    loadCronJobs();
    console.log(`Server is running on http://localhost:${port}`);
});
