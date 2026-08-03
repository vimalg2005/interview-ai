import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, getInterviewAnalytics, extractJobFromUrl, emailInterviewReport, refreshInterviewQuestions, saveStarStory, toggleDayCompletion, saveCodeSandbox } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
import { useAuth } from "../../auth/hooks/useAuth"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const { user } = useAuth()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, questionCount }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, questionCount })
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }

    const getReportById = async (interviewId) => {
        setReport(null)
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response?.interviewReports || [])
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports || []
    }

    const getResumePdf = async (interviewReportId) => {
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            // Handle both Blob responses and raw responses robustly
            const blob = response instanceof Blob ? response : new Blob([ response ], { type: "application/pdf" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 200)
        }
        catch (error) {
            console.log(error)
        }
    }

    const getAnalytics = async () => {
        try {
            const data = await getInterviewAnalytics()
            return data
        } catch (error) {
            console.log(error)
            return null
        }
    }

    const extractFromUrl = async (url) => {
        return await extractJobFromUrl(url)
    }

    const sendEmailReport = async (reportId) => {
        return await emailInterviewReport(reportId)
    }

    const refreshQuestions = async (reportId, type) => {
        let response = null
        try {
            response = await refreshInterviewQuestions(reportId, type)
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        }
        return response?.interviewReport
    }

    const submitStarStory = async (interviewId, questionIndex, storyData) => {
        let response = null
        try {
            response = await saveStarStory(interviewId, questionIndex, storyData)
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        }
        return response?.interviewReport
    }

    const toggleDay = async (interviewId, dayNumber) => {
        let response = null
        try {
            response = await toggleDayCompletion(interviewId, dayNumber)
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        }
        return response?.interviewReport
    }

    const submitCode = async (interviewId, questionIndex, codeData) => {
        let response = null
        try {
            response = await saveCodeSandbox(interviewId, questionIndex, codeData)
            setReport(response?.interviewReport)
        } catch (error) {
            console.log(error)
        }
        return response?.interviewReport
    }

    useEffect(() => {
        if (!user) return

        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, user ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, getAnalytics, extractFromUrl, sendEmailReport, refreshQuestions, submitStarStory, toggleDay, submitCode }

}