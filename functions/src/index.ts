import { onSchedule } from "firebase-functions/v2/scheduler";
/* eslint-disable max-len */
import {
  onDocumentWritten,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";

/* eslint-disable require-jsdoc, object-curly-spacing */
admin.initializeApp();

async function checkAndScheduleEmails() {
  const db = admin.firestore();
  const now = Date.now();
  const seventyTwoHoursLater = now + 72 * 60 * 60 * 1000;

  const eventsSnapshot = await db
    .collection("events")
    .where("start", ">=", now)
    .where("start", "<=", seventyTwoHoursLater)
    .get();

  eventsSnapshot.forEach(async (doc) => {
    const event = doc.data();

    await db.collection("pendingEmails").add({
      from: {
        email: "MS_UMeo50@trial-k68zxl2ydn54j905.mlsender.net",
        name: "Greenview Events",
      },
      to: [
        {
          email: event.email,
          name: "Recipient Name",
        },
      ],
      subject: `Reminder: ${event.title}`,
      text: `Don't forget your upcoming event at ${event.location}.`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Reminder</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #ccc;
              }
              .email-container {
                  max-width: 800px;
                  margin: 20px auto;
                  background-color: #fff;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              }
              .header-background {
                  background-color: #faf3e6;
              }
              .header {
                  background-color: #faf3e6;
                  border-bottom: #9FC37B 4px solid;
                  padding: 20px 40px;
                  text-align: center;
              }
              .h1-green {
                  font-size: x-large;
                  color: #9FC37B;
                  display: inline;
              }
              .h1-black {
                  font-size: x-large;
                  color: #000;
                  display: inline;
              }
              .nav {
                  background-color: #faf3e6;
                  text-align: center;
                  padding: 16px 0;
              }
              .nav a {
                  margin: 0 10px;
                  text-decoration: none;
                  color: #333;
                  font-weight: bold;
              }
              .hero {
                  padding: 40px 20px;
                  text-align: center;
              }
              .hero h1 {
                  font-size: 28px;
                  color: #333;
              }
              .hero p {
                  font-size: 16px;
                  color: #777;
              }
              .event-box {
                  background-color: #9FC37B;
                  color: #fff;
                  border-radius: 8px;
                  max-width: 300px;
                  margin: 20px auto;
                  text-align: center;
              }
              .event-box h2 {
                  font-size: 24px;
                  margin: 20px 0;
              }
              .event-details {
                  font-size: 16px;
                  margin-bottom: 20px;
              }
              .event-details span {
                  display: block;
                  margin-top: 5px;
              }
              .footer {
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #000;
                  background-color: #faf3e6;
              }
              .footer a {
                  color: #000;
                  text-decoration: underline;
              }
          </style>
      </head>
      <body>

      <div class="email-container">
          <!-- Header -->
          <table class="header-background" width="100%">
              <tr>
                  <td class="header">
                      <h1 class="h1-green">Green</h1>
                      <h1 class="h1-black">View</h1>
                  </td>
              </tr>
          </table>

          <!-- Navigation Links -->
          <table class="nav" width="100%">
              <tr>
                  <td>
                      <a href="#">Home</a>
                      <a href="#">About Us</a>
                      <a href="#">Calendar</a>
                  </td>
              </tr>
          </table>

          <!-- Hero Section -->
          <table class="hero" width="100%">
              <tr>
                  <td>
                      <h1>Hey There!</h1>
                      <p>Take a look at this event happening near you soon.</p>
                  </td>
              </tr>
          </table>

          <!-- Event Box -->
          <table class="event-box" width="100%">
              <tr>
                  <td>
                      <h2>${event.title}</h2>
                      <div class="event-details">
                          <span><strong>${new Date(
                            event.start.toDate()
                          ).toLocaleString()}</strong></span>
                          <span>📍 ${event.location}</span>
                      </div>
                  </td>
              </tr>
          </table>

          <!-- Footer -->
          <table class="footer" width="100%">
              <tr>
                  <td>
                      <a href="#">Unsubscribe</a>
                  </td>
              </tr>
          </table>
      </div>

      </body>
      </html>
      `,
      send_at: Math.floor(event.start.toDate().getTime() / 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export const scheduleEmails = onSchedule("every 12 hours", async () => {
  await checkAndScheduleEmails();
  logger.info("Scheduled email check completed.");
});

export const scheduleEmailsOnEventUpdate = onDocumentWritten(
  "events/{eventId}",
  async () => {
    await checkAndScheduleEmails();
    logger.info("Event update detected. Email scheduling checked.");
  }
);

export const sendEmail = onDocumentCreated(
  "pendingEmails/{emailId}",
  async (event) => {
    if (!event.data) {
      logger.error("Event data is undefined.");
      return;
    }
    const emailData = event.data.data();

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer mlsn.f1da8197b27a6d94bf88863e593e7e8b564ea7fc46e49dba313a9533b512013a",
      },
      body: JSON.stringify({
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        send_at: emailData.send_at,
        attachments: emailData.attachments || [],
        headers: emailData.headers || [],
        tags: emailData.tags || [],
        personalization: emailData.personalization || [],
      }),
    });

    const result = await response.json();

    await event.data.ref.update({
      status: response.ok ? "sent" : "failed",
      response: result,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Email sent and document updated with response.", { result });
  }
);
