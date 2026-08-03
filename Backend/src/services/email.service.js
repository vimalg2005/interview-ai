const nodemailer = require("nodemailer")

/**
 * @description Creates Nodemailer transporter with fallback for local testing.
 */
async function createTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }

    // Fallback: Create ethereal test account for development/testing
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    })
}

/**
 * @description Sends formatted interview plan email with PDF attachment.
 */
async function sendInterviewReportEmail({ toEmail, username, report, pdfBuffer }) {
    try {
        const transporter = await createTransporter()

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #30363d;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">🎯</span>
                <h1 style="color: #ffffff; font-size: 24px; margin: 10px 0 5px 0;">InterviewPrep.AI Strategy Report</h1>
                <p style="color: #8b949e; font-size: 14px; margin: 0;">Targeted Preparation Blueprint for <strong>${report.title}</strong></p>
            </div>

            <div style="background-color: #161b22; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #21262d;">
                <p style="font-size: 16px; color: #ffffff; margin-top: 0;">Hi <strong>${username || 'Candidate'}</strong> 👋,</p>
                <p style="font-size: 14px; color: #c9d1d9; line-height: 1.5;">
                    Here is your personalized interview strategy report generated for the <strong>${report.title}</strong> position!
                </p>
                
                <div style="display: inline-block; background-color: #ff2d78; color: #ffffff; font-weight: bold; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px;">
                    Match Score: ${report.matchScore}%
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #ffffff; font-size: 16px; border-bottom: 1px solid #30363d; padding-bottom: 8px;">📋 Key Focus Highlights</h3>
                <ul style="color: #c9d1d9; font-size: 14px; line-height: 1.6; padding-left: 20px;">
                    <li><strong>Technical Questions:</strong> ${report.technicalQuestions?.length || 0} core technical topics mapped</li>
                    <li><strong>Behavioral Frameworks:</strong> ${report.behavioralQuestions?.length || 0} STAR scenario questions</li>
                    <li><strong>Preparation Roadmap:</strong> ${report.preparationPlan?.length || 0} structured study days</li>
                </ul>
            </div>

            <p style="font-size: 13px; color: #8b949e; line-height: 1.4;">
                📎 <em>Your full PDF report & tailored resume are attached to this email. You can also view live practice sessions anytime on your dashboard.</em>
            </p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #21262d; font-size: 12px; color: #7d8590;">
                <p>© InterviewPrep.AI &bull; AI-Powered Career Strategy</p>
            </div>
        </div>
        `

        const attachments = []
        if (pdfBuffer) {
            attachments.push({
                filename: `${report.title || 'interview-strategy'}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            })
        }

        const mailOptions = {
            from: '"InterviewPrep.AI" <no-reply@interviewprep.ai>',
            to: toEmail,
            subject: `🎯 Your Interview Strategy Report: ${report.title}`,
            html: htmlContent,
            attachments
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent info:", info.messageId)

        const testUrl = nodemailer.getTestMessageUrl(info)
        if (testUrl) {
            console.log("Preview Ethereal Email URL:", testUrl)
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: testUrl
        }
    } catch (error) {
        console.error("Failed to send email:", error)
        throw new Error("Email sending failed. Please check SMTP settings or try again.")
    }
}

module.exports = { sendInterviewReportEmail }
