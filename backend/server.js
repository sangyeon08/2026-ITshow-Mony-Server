import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';
import accountRoutes from './routes/accounts.js';
import goalRoutes from './routes/goal.js';
import bucketRoutes from './routes/bucket.js';
import analysisRoutes from './routes/transactions.js';
import groqRoutes from './routes/groq.js';
import bankRoutes from './routes/bank.js';
import statsRoutes from './routes/stats.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

dotenv.config();

const app = express();
const serverStartedAt = Date.now();

// Middleware
app.use(requestLogger);
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: '✅ Backend is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/runtime', (req, res) => {
    res.json({
        serverStartedAt,
    });
});

// Swagger UI 추가
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/buckets', bucketRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/groq', groqRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/stats', statsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🚀 Mony Backend Server Started     ║
╚════════════════════════════════════════╝

📍 Server URL: http://localhost:${PORT}
📚 API Docs: http://localhost:${PORT}/api-docs ⭐
🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}

✅ Available Endpoints:
   - GET  /health                    (Server status)
   - POST   /api/accounts            (Create account)
   - GET    /api/accounts            (Get all accounts)
   - GET    /api/accounts/:id        (Get account by ID)
   - PATCH  /api/accounts/:id        (Update account)
   - DELETE /api/accounts/:id        (Delete account)
   - POST   /api/goals               (Create goal)
   - GET    /api/goals               (Get all goals)
   - GET    /api/goals/progress/:id  (Get goal progress)
   - DELETE /api/goals/:id           (Delete goal)
   - POST   /api/buckets             (Create bucket)
   - GET    /api/buckets             (Get all buckets)
   - GET    /api/buckets/status/all  (Get done/doing status)
   - PATCH  /api/buckets/:id/probability (Update probability)
   - POST   /api/buckets/:id/doing   (Set doing)
   - DELETE /api/buckets/:id         (Delete bucket)
   - GET    /api/analysis/summary/:periodDetail
   - GET    /api/analysis/category/:periodDetail
   - GET    /api/analysis/goal-category/:periodDetail
   - GET    /api/analysis/daily/:periodDetail
   - GET    /api/analysis/uncategorized/:periodDetail
    `);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down...');
    process.exit(0);
});
