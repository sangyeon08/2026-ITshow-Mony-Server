# Backend Folder Structure  
This document outlines the backend folder structure with Express and Supabase integration.

## Folder Structure  
```
2026-ITshow-Mony-Server/
├── backend/
│   ├── config/
│   │   ├── env.example
│   │   ├── cors.js
│   │   └── supabaseClient.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/
│   │   └── accounts.js
│   ├── server.js
│   └── package.json
└── frontend/
```  

## Server Setup  
Create a `server.js` file that initializes an Express server and sets up middleware.

```javascript
const express = require('express');
const cors = require('cors');
const accountsRouter = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API Routes
app.use('/api/accounts', accountsRouter);

app.use(require('./middleware/errorHandler'));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

## .env Setup  
Create a `.env` file in the backend directory with the necessary configuration:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=5000
```

## Middleware  
### Error Handling Middleware  
Create a file `errorHandler.js`:
```javascript
module.exports = (err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
};
```

### Validation Middleware  
Create a file `validation.js` for validating requests:
```javascript
// Sample validation for a POST request
const { check, validationResult } = require('express-validator');

const validateAccount = [
    check('email').isEmail(),
    check('password').isLength({ min: 6 }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = { validateAccount };
```

## Routes for Accounts API  
Create a file `accounts.js` in the routes directory:
```javascript
const express = require('express');
const router = express.Router();
const { validateAccount } = require('../middleware/validation');
const { createAccount, getAccounts } = require('../controllers/accountsController');

router.post('/', validateAccount, createAccount);
router.get('/', getAccounts);

module.exports = router;
```

## Frontend-Friendly API Client Code  
Create an API client to communicate with the accounts API:
```javascript
// apiClient.js
const API_URL = 'http://localhost:5000/api/accounts';

export const createAccount = async (accountData) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(accountData),
    });
    return response.json();
};

export const getAccounts = async () => {
    const response = await fetch(API_URL);
    return response.json();
};
```

## Comprehensive Documentation  
- Ensure that each file and function is well documented with comments and separate markdown files if necessary.
- Provide setup instructions, API endpoints, expected request/response formats, and usage examples.
