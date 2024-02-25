# Chatteree-BE
Chatteree is a sophisticated chat application meticulously crafted to showcase comprehensive development expertise. Its feature set encompasses user authentication through both email and Google account credentials. The app incorporates an email verification mechanism utilizing one-time passcodes (OTPs) sent to the user's registered email address. The authentication process entails fundamental onboarding steps such as creating a username, uploading a profile picture, and configuring a display name.

Once authenticated and logged in, users gain the ability to establish one-on-one chat sessions by adding contacts. Chatteree facilitates the exchange of diverse media types, including images, files, audios, and voice notes, enhancing the interactive communication experience. Users have the option to designate others as favorites and can share status updates, a feature exclusive to the mobile view of the application.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Features](#features)
- [Resources](#resources)

## Installation
The project is created using NodeJS 16.20.0
- Step 1: Clone repository
- Step 2: Create config.json. An example is added in the repository with the desired fields. Please add yours
- Step 3: run npm i
- Step 4: node index.js or nodemon

## Usage
- nodemon or node index.js

## Configuration
Configure your settings by creating the `config.json` file:
```json
{
    "PORT": 3000,
    "NODE_ENV": "local",
    "MONGO_CONNECTION": "",
    "TOKEN_SECRET": "",
    "BASE_URL": "",
    "APP_URL": "",
    "FRONTEND_URL": "",
    "GOOGLE_CLIENT_ID": "",
    "MAIL_DRIVER": "",
    "MAIL_HOST": "",
    "MAIL_PORT": 587,
    "MAIL_FROM_ADDRESS": "",
    "MAIL_FROM_NAME": "",
    "MAIL_PASSWORD": "",
    "MAIL_ENCRYPTION": false,
    "PUSHER": {
        "appId": "",
        "key": "",
        "secret": "",
        "cluster": "",
        "useTLS": true
    },
    "SSH_TUNNEL": {
        "username": "",
        "host": "",
        "port": 22,
        "password": "",
        "dstPort": 27017
    }
}

## Features

1. **User Authentication:**
   - Sign in using email credentials or Google account.
   - Email verification through OTP for enhanced security.

2. **Onboarding Process:**
   - Create a personalized username.
   - Upload a profile picture.
   - Set up a display name.

3. **One-on-One Chat:**
   - Authenticated users can add others to engage in private one-on-one conversations.

4. **Media Sharing:**
   - Send and receive images, files, audios, and voice notes for a dynamic communication experience.

5. **Favorites:**
   - Users can designate specific contacts as favorites for quick access.

6. **Status Updates (Mobile Only):**
   - Exclusive feature allowing users to upload and share status updates, available in the mobile view.

## Resources
Find API documentation at [Documentation URL](https://documenter.getpostman.com/view/2109607/2sA2rDvLKD).