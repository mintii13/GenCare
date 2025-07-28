# GenCare: Smart Gender Healthcare System
*Tran Phu Tho*<sup>(1)</sup>, *Nguyen Minh Tri*<sup>(2)</sup>, *Khuu Trong Quan*<sup>(3)</sup>, *Huynh Kha Tu*<sup>(4)</sup> † FPT University, Vietnam

![](./img/homepage.jpg)

## Overview

**The Gencare: Smart Gender Healthcare System** is a web application that facilitates online medical testing and consultation services. The system enables users to book lab tests, receive expert consultations, and securely access their health records. It includes a built-in chatbot for 24/7 user support. Additionally, the system offers robust management features for staff and administrators to handle appointments, test records, and user data efficiently.

**Software Requirement Specification for GenCare: Smart Gender Healthcare System:** [SRS](./SRS/SRS_for_GenCare_System.pdf)

## System Architecture <br/> 
<img src="./img/Gencare_SystemArchitecture.jpg" width="600" height="1000"></img>
## Docker Running Instructions
```
cd backend
bash src/script/run-redis.sh
```
## Tagging Images After Build
## Environment Configuration (.env)
### Backend Environment Setup
Create a `.env` file in the root of the backend directory with the following variables:
```env
# Backend Environment

APP_NAME=GenCare

# Google OAuth (for login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=24h
NODE_ENV=development
PORT=3000

# Verify OTP
EMAIL_FOR_VERIFY=your-email@example.com
EMAIL_APP_PASSWORD=your-email-app-password
REDIS_PATH_LINE=D:\\FPTU-sourse\\Term5\\SWP\\GenCare

# Google Calendar API (for Google Meet links)
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-google-calendar-id

# Session Secret
SESSION_SECRET=your-session-secret-key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MoMo Payment Configuration
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3000/payment/success
MOMO_IPN_URL=http://localhost:3000/api/payment/momo/ipn

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Frontend Environment

# API Configuration
VITE_API_URL=http://localhost:3000/api

# Authentication
VITE_AUTH_TOKEN_KEY=gencare_auth_token
VITE_AUTH_REFRESH_TOKEN_KEY=gencare_refresh_token

# App Configuration
VITE_APP_NAME=GenCare
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION="Healthcare Services Platform"

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true

# Social Login (if needed)
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Other Services
# VITE_SOCKET_URL=ws://localhost:3000
# VITE_UPLOAD_URL=http://localhost:3000/upload
VITE_CHATBOX_API=your-ai-api-key

```
### Setup Instructions
#### 1. Clone the Repository
```
git clone https://github.com/mintii13/GenCare.git
cd GenCare 
```
#### 2. Install Dependencies
**Backend (TypeScript)**
```
cd backend
npm install
npm run dev
```
**Frontend (Vite/React)**
```
cd frontend
npm install
npm run dev
```


