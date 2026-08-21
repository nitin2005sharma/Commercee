import nodemailer from "nodemailer";

// Define the type for email options
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Define the type for transporter configuration
interface TransporterConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

// Define the type for mail options
interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Email delivery is not configured.");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    } as TransporterConfig);

    const mailOptions: MailOptions = {
      from: "Egwinch",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export default sendEmail;
