const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription, questionCount }) {

    const count = questionCount || 5

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        Please generate exactly ${count} technical questions and exactly ${count} behavioral questions in the report.
`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    })
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

const practiceFeedbackSchema = z.object({
    score: z.number().min(0).max(100).describe("A rating score out of 100 for the quality of the user's answer."),
    feedback: z.array(z.string()).describe("A list of concrete points of feedback: what they did well, what was missing, or how to improve."),
    improvedAnswer: z.string().describe("A professional, high-quality revised version of their answer incorporating the feedback.")
})

async function evaluatePracticeAnswer({ question, intention, userAnswer, jobDescription }) {
    const prompt = `You are an expert interviewer evaluating a candidate's answer for the following question.
                    Question: ${question}
                    Intention of this question: ${intention}
                    Candidate's Answer: ${userAnswer}
                    ${jobDescription ? `Job Description context: ${jobDescription}` : ""}

                    Analyze the response, rate it, and provide constructive feedback with an improved model answer.`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(practiceFeedbackSchema),
        }
    })

    return JSON.parse(response.text)
}
const regeneratedQuestionsSchema = z.object({
    questions: z.array(z.object({
        question: z.string().describe("The question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("List of newly generated questions")
})

async function regenerateQuestions({ resume, selfDescription, jobDescription, currentQuestions, type, count }) {
    const qCount = count || 5
    const existingQsFormatted = currentQuestions && currentQuestions.length > 0
        ? currentQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")
        : "None"

    const prompt = `You are generating new mock interview questions for a candidate.
                    Context:
                    Resume: ${resume || "Not provided"}
                    Self Description: ${selfDescription || "Not provided"}
                    Job Description: ${jobDescription}

                    We already have the following ${type} questions:
                    ${existingQsFormatted}

                    Please generate a new list of exactly ${qCount} DIFFERENT and other possible ${type} questions that could be asked in the interview. 
                    Do not repeat or duplicate any of the current questions listed above. Make them unique, relevant, and comprehensive.`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(regeneratedQuestionsSchema),
        }
    })

    const parsed = JSON.parse(response.text)
    return parsed.questions
}

const starEvaluationSchema = z.object({
    score: z.number().min(0).max(100).describe("A rating score out of 100 for the overall impact and alignment of the story"),
    feedback: z.string().describe("Constructive, detailed analysis of all STAR aspects (Situation, Task, Action, Result) outlining strengths and areas of improvement"),
    improvedVersion: z.string().describe("A revised, high-impact version of the story using the STAR format, written in a natural human voice, highlighting metrics and results")
})

async function evaluateStarStory({ question, situation, task, action, result }) {
    const prompt = `Evaluate a candidate's behavioral story using the STAR framework.
                    Question: ${question}
                    
                    Candidate's STAR Story:
                    - Situation: ${situation}
                    - Task: ${task}
                    - Action: ${action}
                    - Result: ${result}
                    
                    Please review their response, rate it, analyze how well they hit each stage of the STAR method, provide specific critique, and write an improved version of this exact story with higher impact and professional vocabulary.`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(starEvaluationSchema),
        }
    })

    return JSON.parse(response.text)
}

const codeEvaluationSchema = z.object({
    isCorrect: z.boolean().describe("True if the code correctly solves the given technical/coding problem, false otherwise"),
    timeComplexity: z.string().describe("Big-O time complexity of the candidate's solution code, e.g., O(N) or O(N log N)"),
    spaceComplexity: z.string().describe("Big-O space complexity of the candidate's solution code, e.g., O(1) or O(N)"),
    critique: z.string().describe("Detailed code review comment analyzing performance bottlenecks, bugs, styles, and naming suggestions"),
    refactoredCode: z.string().describe("The clean, optimal, well-commented code solution in the same programming language")
})

async function evaluateCodeSolution({ question, code, language }) {
    const prompt = `You are an expert technical interviewer reviewing code written by a candidate.
                    Technical Question: ${question}
                    
                    Candidate's Solution Code (written in ${language}):
                    \`\`\`${language}
                    ${code}
                    \`\`\`
                    
                    Please review their code, determine if it compiles/runs correctly and solves the problem, analyze its Big-O complexities, critique its styling or algorithms, and provide the refactored, optimal solution.`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(codeEvaluationSchema),
        }
    })

    return JSON.parse(response.text)
}

module.exports = { generateInterviewReport, generateResumePdf, evaluatePracticeAnswer, regenerateQuestions, evaluateStarStory, evaluateCodeSolution }