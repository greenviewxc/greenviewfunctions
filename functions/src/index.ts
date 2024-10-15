import {onSchedule} from "firebase-functions/v2/scheduler";
/* eslint-disable max-len */
import {onDocumentWritten, onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
import * as logger from "firebase-functions/logger";

/* eslint-disable require-jsdoc, object-curly-spacing */
admin.initializeApp();

async function checkAndScheduleEmails() {
  const db = admin.firestore();
  const now = Date.now();
  const seventyTwoHoursLater = now + 72 * 60 * 60 * 1000;

  const eventsSnapshot = await db.collection("events")
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
      html: `<p>Don't forget your upcoming event at <strong>${event.location}</strong> 
             on <strong>${new Date(event.start.toDate()).toLocaleString()}</strong>.</p>`,
      send_at: Math.floor(event.start.toDate().getTime() / 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

export const scheduleEmails = onSchedule("every 12 hours", async () => {
  await checkAndScheduleEmails();
  logger.info("Scheduled email check completed.");
});

export const scheduleEmailsOnEventUpdate = onDocumentWritten("events/{eventId}", async () => {
  await checkAndScheduleEmails();
  logger.info("Event update detected. Email scheduling checked.");
});

export const sendEmail = onDocumentCreated("pendingEmails/{emailId}", async (event) => {
  if (!event.data) {
    logger.error("Event data is undefined.");
    return;
  }
  const emailData = event.data.data();

  const response = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer mlsn.f1da8197b27a6d94bf88863e593e7e8b564ea7fc46e49dba313a9533b512013a",
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
});
