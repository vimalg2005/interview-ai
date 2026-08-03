const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, evaluatePracticeAnswer, regenerateQuestions, evaluateStarStory, evaluateCodeSolution } = require("../services/ai.service")
const { extractJobFromUrl } = require("../services/jobScraper.service")
const { sendInterviewReportEmail } = require("../services/email.service")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        let resumeText = ""
        let resumeFileBuffer = null
        let resumeFileName = ""

        if (req.file) {
            const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
            resumeText = resumeContent.text
            resumeFileBuffer = req.file.buffer
            resumeFileName = req.file.originalname
        }

        const { selfDescription, jobDescription, questionCount } = req.body

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription,
            questionCount: questionCount ? parseInt(questionCount, 10) : undefined
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            resumeFile: resumeFileBuffer,
            resumeFileName: resumeFileName,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Failed to generate report."
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    if (interviewReport.resumeFile) {
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=${interviewReport.resumeFileName || 'resume.pdf'}`
        })
        return res.send(interviewReport.resumeFile)
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

/**
 * @description Controller to evaluate a user's answer to an interview question.
 */
async function evaluatePracticeAnswerController(req, res) {
    const { question, intention, userAnswer, jobDescription } = req.body

    if (!question || !userAnswer) {
        return res.status(400).json({
            message: "Question and userAnswer are required."
        })
    }

    try {
        const feedback = await evaluatePracticeAnswer({
            question,
            intention,
            userAnswer,
            jobDescription
        })

        res.status(200).json({
            message: "Answer evaluated successfully.",
            ...feedback
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({
            message: "Failed to evaluate answer."
        })
    }
}

/**
 * @description Controller to fetch aggregated analytics data for user reports.
 */
async function getInterviewAnalyticsController(req, res) {
    try {
        const reports = await interviewReportModel.find({ user: req.user.id })
            .select("title matchScore skillGaps technicalQuestions behavioralQuestions createdAt")
            .sort({ createdAt: 1 })

        if (!reports || reports.length === 0) {
            return res.status(200).json({
                message: "No analytics data available.",
                stats: { totalPlans: 0, averageScore: 0, totalSkillsIdentified: 0 },
                scoreHistory: [],
                topSkills: [],
                questionDistribution: { technical: 0, behavioral: 0 }
            })
        }

        // 1. Stats Calculation
        const totalPlans = reports.length
        const totalScore = reports.reduce((acc, r) => acc + (r.matchScore || 0), 0)
        const averageScore = Math.round(totalScore / totalPlans)

        // 2. Score History
        const scoreHistory = reports.map(r => ({
            id: r._id,
            title: r.title,
            matchScore: r.matchScore || 0,
            date: r.createdAt
        }))

        // 3. Top Skill Gaps Frequency
        const skillFreq = {}
        reports.forEach(r => {
            if (r.skillGaps) {
                r.skillGaps.forEach(gap => {
                    const skill = gap.skill.trim()
                    skillFreq[skill] = (skillFreq[skill] || 0) + 1
                })
            }
        })

        const topSkills = Object.keys(skillFreq).map(skill => ({
            skill,
            count: skillFreq[skill]
        })).sort((a, b) => b.count - a.count).slice(0, 6)

        // 4. Question Distribution
        let technical = 0
        let behavioral = 0
        reports.forEach(r => {
            technical += r.technicalQuestions ? r.technicalQuestions.length : 0
            behavioral += r.behavioralQuestions ? r.behavioralQuestions.length : 0
        })

        res.status(200).json({
            message: "Analytics fetched successfully.",
            stats: {
                totalPlans,
                averageScore,
                totalSkillsIdentified: Object.keys(skillFreq).length
            },
            scoreHistory,
            topSkills,
            questionDistribution: { technical, behavioral }
        })

    } catch (error) {
        console.error("Analytics fetch error:", error)
        res.status(500).json({
            message: "Internal server error."
        })
    }
}

/**
 * @description Controller to extract job details from a posted URL.
 */
async function extractJobFromUrlController(req, res) {
    const { url } = req.body

    if (!url) {
        return res.status(400).json({
            message: "URL parameter is required."
        })
    }

    try {
        const extractedData = await extractJobFromUrl(url)
        res.status(200).json({
            message: "Job details extracted successfully.",
            ...extractedData
        })
    } catch (error) {
        console.error("Extract URL controller error:", error.message)
        res.status(400).json({
            message: error.message || "Failed to extract job details from URL."
        })
    }
}

/**
 * @description Controller to email interview report & PDF to the user's email inbox.
 */
async function emailInterviewReportController(req, res) {
    const { interviewReportId } = req.params

    try {
        const user = await userModel.findById(req.user.id)
        const recipientEmail = user?.email || req.body?.email

        if (!recipientEmail) {
            return res.status(400).json({
                message: "No recipient email found for user."
            })
        }

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        let pdfBuffer = interviewReport.resumeFile
        if (!pdfBuffer) {
            // Generate tailored PDF if original resume wasn't uploaded
            const pdfBase64 = await generateResumePdf({
                resume: interviewReport.resume,
                selfDescription: interviewReport.selfDescription,
                jobDescription: interviewReport.jobDescription
            })
            pdfBuffer = Buffer.from(pdfBase64, 'base64')
        }

        const emailResult = await sendInterviewReportEmail({
            toEmail: recipientEmail,
            username: user?.username || req.user.username,
            report: interviewReport,
            pdfBuffer
        })

        res.status(200).json({
            message: `Interview strategy emailed successfully to ${recipientEmail}!`,
            previewUrl: emailResult.previewUrl,
            ...emailResult
        })
    } catch (error) {
        console.error("Email report controller error:", error)
        res.status(500).json({
            message: error.message || "Failed to email interview report."
        })
    }
}

/**
 * @description Controller to refresh (regenerate) interview questions of a specific type (technical/behavioral) for an existing report.
 */
async function refreshInterviewQuestionsController(req, res) {
    const { interviewId } = req.params
    const { type } = req.body

    if (![ "technical", "behavioral" ].includes(type)) {
        return res.status(400).json({
            message: "Invalid question type. Must be 'technical' or 'behavioral'."
        })
    }

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const currentQuestions = type === "technical" 
            ? interviewReport.technicalQuestions 
            : interviewReport.behavioralQuestions

        const count = currentQuestions.length || 5

        const newQuestions = await regenerateQuestions({
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription,
            jobDescription: interviewReport.jobDescription,
            currentQuestions,
            type,
            count
        })

        if (type === "technical") {
            interviewReport.technicalQuestions = newQuestions
        } else {
            interviewReport.behavioralQuestions = newQuestions
        }

        await interviewReport.save()

        res.status(200).json({
            message: "Questions refreshed successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("Refresh questions error:", err)
        res.status(500).json({
            message: "Failed to refresh questions."
        })
    }
}

/**
 * @description Controller to evaluate and save a candidate's STAR story for a specific behavioral question index.
 */
async function saveStarStoryController(req, res) {
    const { interviewId, questionIndex } = req.params
    const { situation, task, action, result } = req.body

    const qIdx = parseInt(questionIndex, 10)

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (isNaN(qIdx) || qIdx < 0 || qIdx >= interviewReport.behavioralQuestions.length) {
            return res.status(400).json({
                message: "Invalid question index."
            })
        }

        const questionText = interviewReport.behavioralQuestions[qIdx].question

        const evaluation = await evaluateStarStory({
            question: questionText,
            situation,
            task,
            action,
            result
        })

        interviewReport.behavioralQuestions[qIdx].starStory = {
            situation,
            task,
            action,
            result,
            feedback: evaluation.feedback,
            score: evaluation.score,
            improvedVersion: evaluation.improvedVersion
        }

        await interviewReport.save()

        res.status(200).json({
            message: "STAR story evaluated and saved successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("Save STAR story error:", err)
        res.status(500).json({
            message: "Failed to evaluate and save STAR story."
        })
    }
}

/**
 * @description Controller to toggle preparation plan day completion status.
 */
async function toggleDayCompletionController(req, res) {
    const { interviewId, dayNumber } = req.params

    const dayNum = parseInt(dayNumber, 10)

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        // Initialize completedDays if not present (backward compatibility)
        if (!interviewReport.completedDays) {
            interviewReport.completedDays = []
        }

        const idx = interviewReport.completedDays.indexOf(dayNum)
        if (idx > -1) {
            // Day already completed, remove it (uncomplete)
            interviewReport.completedDays.splice(idx, 1)
        } else {
            // Day not completed, add it
            interviewReport.completedDays.push(dayNum)
        }

        await interviewReport.save()

        res.status(200).json({
            message: "Day completion toggled successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("Toggle day completion error:", err)
        res.status(500).json({
            message: "Failed to toggle day completion status."
        })
    }
}

/**
 * @description Controller to evaluate and save a candidate's code solution for a specific technical coding question.
 */
async function saveCodeSandboxController(req, res) {
    const { interviewId, questionIndex } = req.params
    const { code, language } = req.body

    const qIdx = parseInt(questionIndex, 10)

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        if (isNaN(qIdx) || qIdx < 0 || qIdx >= interviewReport.technicalQuestions.length) {
            return res.status(400).json({
                message: "Invalid question index."
            })
        }

        const questionText = interviewReport.technicalQuestions[qIdx].question

        const evaluation = await evaluateCodeSolution({
            question: questionText,
            code,
            language
        })

        interviewReport.technicalQuestions[qIdx].codeSandbox = {
            code,
            language,
            isCorrect: evaluation.isCorrect,
            timeComplexity: evaluation.timeComplexity,
            spaceComplexity: evaluation.spaceComplexity,
            critique: evaluation.critique,
            refactoredCode: evaluation.refactoredCode
        }

        await interviewReport.save()

        res.status(200).json({
            message: "Code solution evaluated and saved successfully.",
            interviewReport
        })

    } catch (err) {
        console.error("Save code sandbox error:", err)
        res.status(500).json({
            message: "Failed to evaluate and save code solution."
        })
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController,
    evaluatePracticeAnswerController,
    getInterviewAnalyticsController,
    extractJobFromUrlController,
    emailInterviewReportController,
    refreshInterviewQuestionsController,
    saveStarStoryController,
    toggleDayCompletionController,
    saveCodeSandboxController
}