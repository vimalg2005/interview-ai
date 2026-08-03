const axios = require("axios")
const cheerio = require("cheerio")

/**
 * @description Extracts text content and job metadata from a job posting URL.
 */
async function extractJobFromUrl(url) {
    if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided.")
    }

    let parsedUrl = url.trim()
    if (!parsedUrl.startsWith("http://") && !parsedUrl.startsWith("https://")) {
        parsedUrl = "https://" + parsedUrl
    }

    try {
        // 1. Fetch HTML using Axios with a realistic User-Agent
        const { data: html } = await axios.get(parsedUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            },
            timeout: 10000
        })

        const $ = cheerio.load(html)

        // 2. Clean unnecessary DOM elements
        $("script, style, noscript, nav, footer, header, iframe, svg, button, input").remove()

        // 3. Extract page title
        let title = $("h1").first().text().trim() || $("title").text().trim()
        if (!title) {
            title = "Extracted Job Posting"
        }

        // 4. Target job description container or main content
        let extractedText = ""

        // Common job description selectors across major job boards
        const selectors = [
            ".job-description",
            "#job-description",
            "[class*='description']",
            "[class*='detail']",
            "main",
            "article"
        ]

        for (const selector of selectors) {
            if ($(selector).length > 0) {
                const text = $(selector).text().replace(/\s+/g, " ").trim()
                if (text.length > 200) {
                    extractedText = text
                    break
                }
            }
        }

        // Fallback to body text if no specific container was found
        if (!extractedText || extractedText.length < 100) {
            extractedText = $("body").text().replace(/\s+/g, " ").trim()
        }

        // Clean up excessive spaces
        extractedText = extractedText.replace(/\n\s*\n/g, "\n").trim()

        if (!extractedText || extractedText.length < 50) {
            throw new Error("Could not extract readable job text from the provided URL.")
        }

        return {
            title,
            jobDescription: extractedText,
            sourceUrl: parsedUrl
        }
    } catch (error) {
        console.error("Scraper error:", error.message)
        throw new Error("Failed to extract job details from the provided URL. Please verify the URL or paste the job description manually.")
    }
}

module.exports = { extractJobFromUrl }
