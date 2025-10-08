/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/* const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger"); */

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
// setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/* const {onRequest} = require("firebase-functions/v2/https"); */
const {onValueWritten} = require("firebase-functions/v2/database");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");
require("dotenv").config();

admin.initializeApp();

/**
 * Sends a message to a Telegram chat using the Telegram Bot API.
 * @param {string} messageToSend - The message to send.
 * @return {Promise<boolean>}
 * - Returns true if the message was sent successfully, false otherwise.
 */
async function sendTelegramMessage(messageToSend) {
  try {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHATID;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    await axios.post(url, {
      chat_id: chatId,
      text: messageToSend,
      parse_mode: "Markdown",
    });

    console.log("Telegram message sent successfully.");
    return true;
  } catch (error) {
    console.error("Telegram error: ", error.message);
    return false;
  }
}

exports.alertOnRedEvent = onValueWritten({
  ref: "device/device01/vibration_events/{eventId}",
}, async (event) => {
  const eventData = event.data.after.val();
  const level = eventData.level;
  const magnitude = eventData.magnitude;
  const timestamp = new Date(eventData.timestamp * 1000)
      .toLocaleString("en-GB", {
        timeZone: "Europe/Brussels",
      });


  // Sending RED ALERT
  if (level === "RED") {
    const message =
      `*RED VIBRATION ALERT*\n\n` +
      `*Level:* ${level}\n` +
      `*Magnitude:* ${magnitude}\n` +
      `*Time:* ${timestamp}\n` +
      `*Device:* device01\n\n` +
      `High vibration detected! Check Equipment Right Now.`;

    await sendTelegramMessage(message);
    console.log(`Red alert sent: Magnitude ${magnitude} at ${timestamp}`);
  }

  // Sending ORANGE ALERT
  if (level === "ORANGE") {
    const message =
      `*ORANGE VIBRATION WARNING*\n\n` +
      `*Level:* ${level}\n` +
      `*Magnitude:* ${magnitude}g\n` +
      `*Time:* ${timestamp}\n` +
      `*Device:* device01\n\n` +
      `Medium vibration detected. Monitor equipment.`;

    await sendTelegramMessage(message);
    console.log(`Orange alert sent: Magnitude 
      ${magnitude} at ${timestamp}`);
  }

  // Back to normal level
  if (level === "RESOLVED") {
    const message =
      `*VIBRATION RESOLVED*\n\n` +
      `*Magnitude dropped to:* ${magnitude}g\n` +
      `*Time:* ${timestamp}\n` +
      `*Device:* device01\n\n` +
      `All clear! Vibration returned to normal levels.`;

    await sendTelegramMessage(message);
    console.log(`Orange alert sent: Magnitude 
      ${magnitude} at ${timestamp}`);
  }

  return null;
});

// ==== DAILY Summary Function (with Telegram) ====
exports.dailySummary = onSchedule(
    {
      schedule: "0 23 * * *", // every day at 23:00
      timeZone: "Europe/Berlin",
    },
    async (event) => {
      const ref = admin.database()
          .ref("device/device01/vibration_events/");
      const snapshot = await ref.once("value");
      const events = snapshot.val();

      if (!events) {
        console.log("No vibration events found for daily summary.");
        return null;
      }

      let total = 0;
      let redCount = 0;
      let orangeCount = 0;
      let resolvedCount = 0;
      const magnitudesArray = [];

      Object.values(events).forEach((event) => {
        total++;
        magnitudesArray.push(event.magnitude);
        if (event.level === "RED") redCount++;
        if (event.level === "ORANGE") orangeCount++;
        if (event.level === "RESOLVED") resolvedCount++;
      });

      const avgMagnitude =
        magnitudesArray.reduce((a, b) => a + b, 0) / magnitudesArray.length;

      const report = {
        date: new Date().toISOString().split("T")[0],
        total_events: total,
        red_events: redCount,
        orange_events: orangeCount,
        resolved_events: resolvedCount,
        average_magnitude: avgMagnitude.toFixed(2),
      };

      // Store in Firebase
      await admin.database().ref("daily_reports").push(report);

      const summaryMessage =
        `*Daily Vibration Summary*\n` +
        `Date: ${report.date}\n\n` +
        `*Statistics*\n` +
        `Total Events: ${report.total_events}\n` +
        `Red Alerts: ${report.red_events}\n` +
        `Orange Warnings: ${report.orange_events}\n` +
        `Resolved: ${report.resolved_events}\n` +
        `Avg Magnitude: ${report.average_magnitude}\n\n` +
        `Device: device01`;

      await sendTelegramMessage(summaryMessage);

      console.log("Daily report generated and sent:", report);

      return null;
    });

exports.checkHeartbeat = onSchedule(
    {
      schedule: "0 9 * * *",
      timeZone: "Europe/Brussels",
    },
    async (event) => {
      const ref = admin.database().ref("device/device01/heartbeat");
      const snapshot = await ref.limitToLast(1).once("value");

      if (!snapshot.exists()) {
        const message =
          `*Device Offline Alert*\n\n` +
          `Device: device01\n` +
          `Status: No heartbeat detected\n` +
          `The ESP32 may bo offline or getting errors.`;

        await sendTelegramMessage(message);
        console.log("Heartbeat alert sent - device may be offline");
        return null;
      }

      const lastHeartbeat = Object.values(snapshot.val())[0];
      const lastTimestamp = lastHeartbeat.timestamp * 1000;
      const now = Date.now();
      const hoursSinceLastHeartbeat = (now - lastTimestamp) / (1000 * 60 * 60);

      // Alert if no heartbeat in the last 25 hours
      if (hoursSinceLastHeartbeat > 25) {
        const message =
          `*Device Offline Alert*\n\n` +
          `Device: device01\n` +
          `Last Hearbeat: ${Math.round(hoursSinceLastHeartbeat)} hours ago\n` +
          `The ESP32 may bo offline or getting errors.`;

        await sendTelegramMessage(message);
        console.log(`Heartbeat alert sent - 
          last seen ${hoursSinceLastHeartbeat} hours ago`);
      } else {
        console.log(`Device online - 
          last seen ${hoursSinceLastHeartbeat} hours ago`);
      }
    });
