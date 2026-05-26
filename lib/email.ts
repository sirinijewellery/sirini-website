interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  // TODO: Wire up email provider (Resend or Nodemailer) when decided
  // For now, logs to console in development
  console.log("[Contact Form Submission]", {
    to: process.env.CONTACT_EMAIL,
    from: data.email,
    name: data.name,
    message: data.message,
    timestamp: new Date().toISOString(),
  });
}
