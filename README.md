# Cronjob_Application
 
theme-app/
├── backend/                 # Backend (Node.js + Express)
│   ├── models/
│   │   └── User.js          # User schema model
│   ├── routes/
│   │   └── auth.js          # Authentication and theme routes
│   ├── .env                 # Environment variables (e.g., DB connection, JWT secret)
│   ├── server.js            # Main server file
│   └── package.json         # Backend dependencies
├── frontend/                # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── AuthForm.js  # Login/Register form component
│   │   ├── App.js           # Main app component
│   │   ├── App.css          # Global styles (themes)
│   │   └── index.js         # React app entry point
│   └── package.json         # Frontend dependencies
└── README.md                # Documentation
