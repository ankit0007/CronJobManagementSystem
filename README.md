<h1>Cron Job Management System</h1>

<p>This is a Node.js-based Cron Job Management System that allows users to create, edit, and delete cron jobs. Each cron job triggers an HTTP GET request to a specified URL at a set interval. Log outputs are displayed in the server console (success or failure), but logs are not stored in any database or file.</p>

<h2>Table of Contents</h2>
<ul>
    <li><a href="#features">Features</a></li>
    <li><a href="#technologies-used">Technologies Used</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#running-the-application">Running the Application</a></li>
    <li><a href="#usage-guide">Usage Guide</a></li>
    <li><a href="#folder-structure">Folder Structure</a></li>
    <li><a href="#code-explanation">Code Explanation</a></li>
    <li><a href="#default-login-credentials">Default Login Credentials</a></li>
    <li><a href="#license">License</a></li>
</ul>

<h2 id="features">Features</h2>
<ul>
    <li><strong>Add Cron Job</strong>: Set a URL and interval in minutes for periodic HTTP GET requests.</li>
    <li><strong>View Cron Jobs</strong>: List all scheduled cron jobs.</li>
    <li><strong>Edit Cron Job</strong>: Update the URL or interval of an existing cron job.</li>
    <li><strong>Delete Cron Job</strong>: Stop and remove a scheduled cron job.</li>
    <li><strong>Authentication</strong>: Protected routes with session-based login.</li>
    <li><strong>Console Logging</strong>: Log results of each cron job execution in the console.</li>
</ul>

<h2 id="technologies-used">Technologies Used</h2>
<ul>
    <li><strong>Node.js</strong>: Server-side runtime environment.</li>
    <li><strong>Express</strong>: Web framework for handling HTTP requests and middleware.</li>
    <li><strong>node-cron</strong>: Scheduler for managing cron jobs.</li>
    <li><strong>axios</strong>: HTTP client for sending requests.</li>
    <li><strong>express-session</strong>: Session middleware for login management.</li>
    <li><strong>Bootstrap</strong>: Frontend framework for responsive design.</li>
</ul>

<h2 id="installation">Installation</h2>

<h3>Prerequisites</h3>
<ul>
    <li><strong>Node.js</strong> (version 14 or higher) and <strong>npm</strong></li>
</ul>

<h3>Steps</h3>
<ol>
    <li><strong>Clone the Repository</strong>
        <pre><code>git clone &lt;repository_url&gt;
cd cron-job-frontend
</code></pre>
    </li>
    <li><strong>Install Dependencies</strong>
        <pre><code>npm install</code></pre>
    </li>
</ol>

<h2 id="configuration">Configuration</h2>
<ol>
    <li><strong>Session Secret</strong>: The session secret in <code>server.js</code> can be customized by changing the value of <code>secret</code> in <code>express-session</code> configuration.</li>
    <li><strong>Customize Default Credentials</strong>: The login credentials (<code>admin</code> and <code>password</code>) are currently hardcoded in <code>server.js</code>. To change them, update the relevant code in the login route.</li>
</ol>

<h2 id="running-the-application">Running the Application</h2>
<ol>
    <li>Start the server:
        <pre><code>node server.js</code></pre>
    </li>
    <li>Access the application in your browser:
        <pre><code>http://localhost:3000</code></pre>
    </li>
    <li>Log in using the default credentials:
        <ul>
            <li><strong>Username</strong>: <code>admin</code></li>
            <li><strong>Password</strong>: <code>password</code></li>
        </ul>
    </li>
</ol>

<h2 id="usage-guide">Usage Guide</h2>

<p>Once logged in, you can manage cron jobs as follows:</p>
<ul>
    <li><strong>Add a Cron Job</strong>: Enter a URL and interval (in minutes) to schedule a periodic HTTP GET request.</li>
    <li><strong>View All Cron Jobs</strong>: See all active cron jobs in the list on the main page.</li>
    <li><strong>Edit a Cron Job</strong>: Update the URL or interval for any cron job.</li>
    <li><strong>Delete a Cron Job</strong>: Remove a cron job from the schedule.</li>
    <li><strong>Console Logs</strong>: The results of each cron job (success or failure) are logged in the console.</li>
</ul>

<h2 id="folder-structure">Folder Structure</h2>

<pre><code>cron-job-frontend/
├── public/
│   ├── index.html     # Main frontend file for cron job management
│   └── login.html     # Login page
├── cronJobsData.json  # Stores cron job data for persistence across restarts
├── server.js          # Main server file with backend logic
└── README.md          # This README file
</code></pre>

<h2 id="code-explanation">Code Explanation</h2>

<h3>server.js</h3>

<p>The <code>server.js</code> file is the main backend file. Below are the main sections of the code:</p>

<ol>
    <li><strong>Imports and Middleware</strong>:
        <ul>
            <li><code>express</code>: For handling routes and HTTP requests.</li>
            <li><code>express-session</code>: For session-based authentication.</li>
            <li><code>node-cron</code>: To schedule cron jobs.</li>
            <li><code>axios</code>: To make HTTP requests.</li>
            <li><code>fs</code> and <code>path</code>: To manage file persistence.</li>
        </ul>
    </li>
    <li><strong>Session and Static File Configuration</strong>:
        <ul>
            <li><code>express-session</code> is used for session-based login management.</li>
            <li>Static files (<code>index.html</code> and <code>login.html</code>) are served from the <code>public</code> folder, protected by session authentication.</li>
        </ul>
    </li>
    <li><strong>Authentication Middleware</strong>:
        <ul>
            <li><code>isAuthenticated</code>: Middleware function that checks if a user is logged in. Redirects to <code>/login</code> if not.</li>
        </ul>
    </li>
    <li><strong>Routes</strong>:
        <ul>
            <li><code>/login</code> and <code>/logout</code>: Handle user login and logout.</li>
            <li><code>/</code>: Main page for managing cron jobs.</li>
            <li><code>/schedule</code>: Creates and schedules a new cron job.</li>
            <li><code>/jobs</code>: Retrieves all current cron jobs.</li>
            <li><code>/jobs/:id (DELETE)</code>: Deletes a specified cron job.</li>
            <li><code>/jobs/:id (PUT)</code>: Updates an existing cron job.</li>
        </ul>
    </li>
    <li><strong>Cron Job Management</strong>:
        <ul>
            <li><code>loadCronJobs</code>: Loads cron jobs from <code>cronJobsData.json</code> when the server starts, rescheduling each task.</li>
            <li><code>saveCronJobs</code>: Saves cron job configurations to <code>cronJobsData.json</code> after any addition, deletion, or update.</li>
            <li>Scheduled cron jobs make an HTTP GET request to the specified URL. Successes and failures are logged to the console only.</li>
        </ul>
    </li>
</ol>

<h2 id="default-login-credentials">Default Login Credentials</h2>
<ul>
    <li><strong>Username</strong>: <code>admin</code></li>
    <li><strong>Password</strong>: <code>password</code></li>
</ul>

<h2 id="license">License</h2>
<p>This project is open-source and available under the <a href="LICENSE">MIT License</a>.</p>
