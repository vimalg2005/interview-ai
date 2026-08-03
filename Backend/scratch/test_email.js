require("dotenv").config({ path: "../.env" })
const { sendInterviewReportEmail } = require("../src/services/email.service")

async function testEmail() {
    console.log("Testing Nodemailer Email Dispatch...")
    const mockReport = {
        title: "Software Engineer at Google",
        matchScore: 88,
        technicalQuestions: [{ q: 1 }, { q: 2 }],
        behavioralQuestions: [{ q: 1 }],
        preparationPlan: [{ d: 1 }, { d: 2 }, { d: 3 }]
    }

    try {
        const res = await sendInterviewReportEmail({
            toEmail: "vimalgupta9660@gmail.com",
            username: "vimalgupta9660",
            report: mockReport,
            pdfBuffer: Buffer.from("Mock PDF Content")
        })

        console.log("SUCCESS! Result:", res)
    } catch (err) {
        console.error("ERROR:", err)
    }
}

testEmail()
