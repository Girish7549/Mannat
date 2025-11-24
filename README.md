
# MLM Backend

## Setup
1. Copy `.env.example` to `.env` and fill values (MONGO_URI, JWT_SECRET, CLOUDINARY_URL).
2. `npm install`
3. `npm run seed` (optional - creates sample tasks & users)
4. `npm run dev` to run in dev mode (nodemon) or `npm start` for production.

## API endpoints (base /api)
- POST /api/auth/register
- POST /api/auth/login
- GET /api/tasks
- POST /api/tasks/complete/:taskId
- GET /api/user/me
- POST /api/user/withdraw
- POST /api/kyc/submit (multipart/form-data)
- POST /api/kyc/verify/:userId (admin)
- GET /api/admin/users (admin)
- POST /api/admin/verify-kyc/:userId (admin)

