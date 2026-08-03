import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile, questionCount }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)
    if (questionCount) {
        formData.append("questionCount", questionCount)
    }
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })

    return response.data

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}

/**
 * @description Service to evaluate a user's answer to an interview question during a practice session.
 */
export const evaluatePracticeAnswer = async ({ question, intention, userAnswer, jobDescription }) => {
    const response = await api.post("/api/interview/practice", {
        question,
        intention,
        userAnswer,
        jobDescription
    })

    return response.data
}

/**
 * @description Service to fetch aggregated user plan analytics.
 */
export const getInterviewAnalytics = async () => {
    const response = await api.get("/api/interview/analytics")
    return response.data
}

/**
 * @description Service to extract job description text from a job URL.
 */
export const extractJobFromUrl = async (url) => {
    const response = await api.post("/api/interview/extract-url", { url })
    return response.data
}

/**
 * @description Service to email interview strategy report & PDF to candidate inbox.
 */
export const emailInterviewReport = async (interviewReportId) => {
    const response = await api.post(`/api/interview/email/${interviewReportId}`)
    return response.data
}

/**
 * @description Service to refresh (regenerate) mock interview questions of a specific type (technical/behavioral) for an existing report.
 */
export const refreshInterviewQuestions = async (interviewId, type) => {
    const response = await api.post(`/api/interview/refresh-questions/${interviewId}`, { type })
    return response.data
}

/**
 * @description Service to evaluate and save behavioral STAR story draft.
 */
export const saveStarStory = async (interviewId, questionIndex, { situation, task, action, result }) => {
    const response = await api.post(`/api/interview/report/${interviewId}/question/${questionIndex}/star`, {
        situation,
        task,
        action,
        result
    })
    return response.data
}

/**
 * @description Service to toggle a daily roadmap completion status.
 */
export const toggleDayCompletion = async (interviewId, dayNumber) => {
    const response = await api.post(`/api/interview/report/${interviewId}/toggle-day/${dayNumber}`)
    return response.data
}

/**
 * @description Service to evaluate and save code sandbox solutions.
 */
export const saveCodeSandbox = async (interviewId, questionIndex, { code, language }) => {
    const response = await api.post(`/api/interview/report/${interviewId}/technical/${questionIndex}/code`, {
        code,
        language
    })
    return response.data
}