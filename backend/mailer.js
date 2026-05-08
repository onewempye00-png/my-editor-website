const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

module.exports = async function sendEmail(to, subject, text) {
    await transporter.sendMail({
        from: `My Editor <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text
    });
};