const nodemailer = require("nodemailer");

// ⚠️ Replace with your real email + app password
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "youremail@gmail.com",
        pass: "yourapppassword"
    }
});

const sendEmail = async (to, subject, text) => {
    await transporter.sendMail({
        from: "My Editor <youremail@gmail.com>",
        to,
        subject,
        text
    });
};

module.exports = sendEmail;