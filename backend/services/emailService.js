const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || "Memory <onboarding@resend.dev>";

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

async function sendEmail({ to, subject, html }) {
  if (!resendClient) {
    console.warn("Resend API key not configured, skipping email send.");
    return;
  }

  await resendClient.emails.send({
    from: resendFrom,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
};

