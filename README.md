# GenCare: Smart Gender Healthcare System
*Tran Phu Tho*<sup>(1)</sup>, *Nguyen Minh Tri*<sup>(2)</sup>, *Khuu Trong Quan*<sup>(3)</sup>, *Huynh Kha Tu*<sup>(4)</sup> † FPT University, Vietnam

![](./img/homepage.jpg)

## Overview

**The Gencare: Smart Gender Healthcare System** is a web application that facilitates online medical testing and consultation services. The system enables users to book lab tests, receive expert consultations, and securely access their health records. It includes a built-in chatbot for 24/7 user support. Additionally, the system offers robust management features for staff and administrators to handle appointments, test records, and user data efficiently.

**Software Requirement Specification for GenCare: Smart Gender Healthcare System:** [SRS](./SRS/SRS_for_GenCare_System.pdf)

## System Architecture
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
APP_NAME=GenCare

# Google OAuth (cho login)
GOOGLE_CLIENT_ID=779602867295-1sn72ljqpjj8oahsq57erurckr2c609v.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/GenCare
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRY=24h
NODE_ENV=development
PORT=3000

# Verify OTP
EMAIL_FOR_VERIFY=khuutrongquan220405@gmail.com
EMAIL_APP_PASSWORD=gyzx torm ugcb soyx
REDIS_PATH_LINE=D:\FPTU-sourse\Term5\SWP\GenCare

# Google Calendar API (cho Google Meet links)
GOOGLE_PROJECT_ID=gencare-463403
GOOGLE_CLIENT_EMAIL=gencare-calendar@gencare-463403.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCeIHmQDs4M+Uob\nb9wePbFMZ6f4/uoYQQU8lP6xXHEt49m5ZCdzf8ZZuRj0st+HOevwCyt8Cd47fkGG\nO8NySWY3Ofdg7uQd5pe0GciQXr29p3/idRERr/+NPvMid53rig0YYzPJ2j5bLwcp\nwZh5p1v4SB8+fp+LLb+RsePEdajNbJjFJe1I09cSgSxWZ8jb43KLcspwGnOsJuHF\nMGuMMQoAKWJKRAvADcOb/Y3qfBT5tNdcI7XOo/oxSxKP1/mfVFsMOajw1j2p6GGF\nXQ3J1TWwU+JpLoicKry1Yv9T3qWoo9jpmXLu4TalULvb3qtjq3HwCPtJH1gWJCdw\nmE3Uf74BAgMBAAECggEAGo0wbFiYD8SiRXYke213gnFbWquPKlBsrS4FkEmJ9Z8v\nVXp0R2gaqcEzaA9LCl1W+UEe5Z6QkuPR49TQLjYV9EsG919VrZGlQogbzeYirSBd\nkGyA17v6SMDbuZtlSIIvTbuGnCvJ0azVYpUP4cmQ32FY4bkIWCnv42p/6OKq3AdO\ntxxZ+JsyzZTyG1qf+TuwExWxPDKklvGkamdbfnFEdxfC091P4sOisnfaFaGQPzkj\n3Nj4LTcoBU5Isx8+4FLg3vb7B9bKYmFp+8FLhst7Kiao4y8b+bQx+6Kk7H9y8ZdL\nEiL1ZZRSfdgazDn4k5dCWZDZ6M0OnP2j9EO6BxEcmQKBgQDfL2yriH4ET5KnHzuQ\nAEU4/qjiNM3oQkGz6ixF/hzYa6PlaHK+Kw9BOIjVFFdp18187sTfytNFN9mPECXI\nklmP9b92sW9McOFVqXsMnVMIVXQyaWWtB54i3PRQVD7QMVk3NE2vQlEuHCRYIqka\nJ6fbi4fvcPVUeje5wpz5hrGUfQKBgQC1YElY5jEyjYZ1qzFPIr3YDyNM2/UjVP/d\ng9S6HlbwHui1D1Eyx/CrKp9ump7xWIRI7ATvTDbZplQY4r2OQ8goCiPAE3ZKceA5\nIwbhwTrjVA/OekP2gwQ0VCef7qseLJl3iJtM7Rb1VAPEyBF0rWoTLjb3FBRMxVCF\nCcA75Nya1QKBgQDFUvG6axA3kX7w4W1Q8NxC+uyoKtWOLt5WSolgTL6GHg0nLASe\n3AU9vdVExxpOCy2z8or/7hyCy1E/6p/tSG+FF1pzf4cOx5KCoTiYu5QI/zyfwY3S\nwLRw0Hf1ebabbbYaV9UDShfqM5lyjxqBdGQ1eJTz/yP4z6HrTARrnUnuJQKBgQCD\nl/l/a3wUXoRIyU08SkuM/+avtALWgKwnTqe/5ZVUIEjcXOGfw1rFBWapO7vIBV3s\n/njSGezN2xS2/YNkPZ9yFXE8waIYfyicq+IpVyXfm7TgLOs0ZnhdcxVQvzwd52Pt\nSwrKNFZs5mjZlAK+Mbd9dRFiEIpt7Nbvv1Re4DyChQKBgAK4TWXk1oW5lPUabey4\nX97dEWOhLD/QnHL6Pr8LJtIpTbcFaxfUkQCVSjqK0pQ1Udtg1V1LKC1c3BE2J4dC\nFtvNLtw7euH5qbI9Kx1hFIg+J0xYaAjGBICvGFNsNCKqz7U8g9AG7NMSNJlFIyB1\nl2ZOu1M/9MWlnQO5oGsrS7zo\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=185296dee29247d56b180f7cfb5c5278912a619558e3d14909b6653b489b2b1f@group.calendar.google.com

# Session Secret
SESSION_SECRET=your-session-secret-key-here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# MoMo Payment Configuration
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3000/payment/success
MOMO_IPN_URL=http://localhost:3000/api/payment/momo/ipn

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Setup
Create a `.env` file in the root of the frontend directory:
```env
# # API Configuration
VITE_API_URL=http://localhost:3000/api
# VITE_API_TIMEOUT=5000

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

# Social Login (nếu cần)
VITE_GOOGLE_CLIENT_ID=779602867295-1sn72ljqpjj8oahsq57erurckr2c609v.apps.googleusercontent.com


# # Other Services
# VITE_SOCKET_URL=ws://localhost:3000
# VITE_UPLOAD_URL=http://localhost:3000/upload
VITE_CHATBOX_API=http://n8n-swo.duckdns.org:5678/webhook/af68b43e-c9f5-46d7-9ad1-dc059baf2984/chat
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
```
**Frontend (Vite/React)**
```
cd frontend
npm install
```
#### 3. Run the Application
```
npm run dev
```

