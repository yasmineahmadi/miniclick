# MiniClick - URL Shortener

MiniClick is a simple and lightweight URL shortener application built with Node.js, Express, and SQLite. It allows users to create short URLs, track clicks, and view detailed statistics about their links.

---

## Features

- **User Authentication**: Sign up, log in, and log out.
- **URL Shortening**: Create short URLs for long links.
- **Custom Short Codes**: Option to use custom short codes (Pro feature or after watching an ad).
- **Click Tracking**: Track clicks on shortened URLs, including:
  - IP address
  - User agent (device, browser, etc.)
  - Timestamp
- **Dashboard**: View detailed statistics for your shortened URLs.
- **Free and Pro Tiers**:
  - Free tier: Limited to 5 links.
  - Pro tier: Unlimited links and custom short codes.

---

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: SQLite
- **Authentication**: Session-based authentication with `express-session`
- **Password Hashing**: `bcryptjs`
- **URL Shortening**: `shortid`
- **User Agent Parsing**: `ua-parser-js`
- **Frontend**: EJS (Embedded JavaScript templates)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cloudsoftwareoff/mini-click.git
   cd mini-click
   ```

2. Install dependencies:
    ```bash
    npm install
    ```


## © 2023 CloudSoftware Inc. All rights reserved.

Enjoy using MiniClick! 🚀