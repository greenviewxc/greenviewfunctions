# Firebase Functions for Event Scheduling and Email Notifications

This project is a Firebase Functions application designed to handle event scheduling and email notifications. It uses Firestore as a database to manage events and pending emails, and utilizes the MailerSend API to send notification emails for scheduled events. The setup includes TypeScript and Firebase Functions (2nd generation) with Eventarc triggers.

## Project Overview

The project contains three primary functions:
1. **`scheduleEmails`**: A scheduled function that runs every 12 hours to check for upcoming events and schedules emails accordingly.
2. **`scheduleEmailsOnEventUpdate`**: A Firestore-triggered function that initiates email scheduling whenever an `events` document is written (created or updated).
3. **`sendEmail`**: A Firestore-triggered function that sends an email through the MailerSend API whenever a new document is created in the `pendingEmails` collection.

## Setup Instructions

### 1. Clone the Repository
Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/your-new-repo.git
cd your-new-repo

cd functions
npm install node-fetch

firebase deploy --only functions

├── functions/
│   ├── src/
│   │   └── index.ts  // Main Firebase Functions code
│   ├── package.json  // Dependencies and scripts
│   ├── tsconfig.json // TypeScript configuration
│   └── .eslintrc.cjs // ESLint configuration
└── README.md



