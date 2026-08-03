const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route POST /api/interview/practice
 * @description evaluate user answer for practice question
 * @access private
 */
interviewRouter.post("/practice", authMiddleware.authUser, interviewController.evaluatePracticeAnswerController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)



/**
 * @route GET /api/interview/analytics
 * @description get interview reports analytics for logged in user.
 * @access private
 */
interviewRouter.get("/analytics", authMiddleware.authUser, interviewController.getInterviewAnalyticsController)

/**
 * @route POST /api/interview/extract-url
 * @description extract job description text from job posting URL.
 * @access private
 */
interviewRouter.post("/extract-url", authMiddleware.authUser, interviewController.extractJobFromUrlController)

/**
 * @route POST /api/interview/email/:interviewReportId
 * @description email interview report & PDF attachment to user's registered email inbox.
 * @access private
 */
interviewRouter.post("/email/:interviewReportId", authMiddleware.authUser, interviewController.emailInterviewReportController)

/**
 * @route POST /api/interview/refresh-questions/:interviewId
 * @description refresh (regenerate) interview questions of a specific type (technical/behavioral) for an existing report.
 * @access private
 */
interviewRouter.post("/refresh-questions/:interviewId", authMiddleware.authUser, interviewController.refreshInterviewQuestionsController)

/**
 * @route POST /api/interview/report/:interviewId/question/:questionIndex/star
 * @description evaluate and save candidate's behavioral STAR story for a specific question index.
 * @access private
 */
interviewRouter.post("/report/:interviewId/question/:questionIndex/star", authMiddleware.authUser, interviewController.saveStarStoryController)

/**
 * @route POST /api/interview/report/:interviewId/toggle-day/:dayNumber
 * @description toggle candidate's preparation plan day completion status.
 * @access private
 */
interviewRouter.post("/report/:interviewId/toggle-day/:dayNumber", authMiddleware.authUser, interviewController.toggleDayCompletionController)

/**
 * @route POST /api/interview/report/:interviewId/technical/:questionIndex/code
 * @description evaluate and save candidate's code sandbox solution.
 * @access private
 */
interviewRouter.post("/report/:interviewId/technical/:questionIndex/code", authMiddleware.authUser, interviewController.saveCodeSandboxController)


module.exports = interviewRouter