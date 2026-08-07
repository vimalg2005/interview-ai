import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import ThemeToggle from '../components/ThemeToggle'

const FEATURE_DETAILS = {
    ats: {
        title: "ATS Alignment Analysis",
        icon: "📊",
        subtitle: "AI-Powered ATS Matching & Skill Gap Insights",
        desc: "Our advanced parser evaluates your resume directly against the target Job Description using state-of-the-art Large Language Models. It extracts keyword frequencies, checks for essential credentials, and analyzes semantic similarities.",
        bullets: [
            "🏆 Match Score: Instant percentage rating showing how well your profile aligns with the role.",
            "⚠️ Gaps Checklist: A list categorized by severity (High/Medium/Low) highlighting missing skills, technologies, or domain experience.",
            "💡 ATS Advice: Strategic tips to optimize your profile's phrasing for machine parsers."
        ]
    },
    roadmap: {
        title: "Custom Prep Roadmap",
        icon: "📅",
        subtitle: "Structured Day-by-Day Preparation Blueprint",
        desc: "Don't guess what to study. Our AI designs a specialized study timeline customized to cover your exact skill gaps and prioritize core interview topics.",
        bullets: [
            "🧠 Day 1: Core conceptual review, syntax refreshers, and basic system design foundations.",
            "🚀 Day 2: Focus on complex problem solving, behavioral framework checklists, and domain engineering.",
            "🏁 Day 3: Mock chat simulations, final pitch refinement, and stress-testing."
        ]
    },
    mock: {
        title: "Interactive Mock Chats",
        icon: "🤖",
        subtitle: "Real-Time Interactive AI Mock Interviews",
        desc: "Simulate a live technical or behavioral interview with our voice-and-text enabled AI interviewer. Get tested on the exact questions generated for your profile.",
        bullets: [
            "👥 Realistic Scenarios: Simulates professional, context-aware interview follow-up questions.",
            "⭐ Instant Feedback: Scores each answer individually out of 10 with clear rubrics.",
            "✍️ Answer Refinement: Provides rewrite suggestions, showing you how to phrase your experience for maximum impact."
        ]
    },
    resume: {
        title: "ATS Resume Customizer",
        icon: "📄",
        subtitle: "Dynamic ATS Resume Tuning & Export",
        desc: "Instantly tailor your experience descriptions to target the specific verbs and requirements highlighted by the employer's job description.",
        bullets: [
            "🔨 Resume Builder: Injects action verbs, structural phrasing, and metrics to match requirements.",
            "👁️ Interactive Customizer: Preview suggestions line by line before exporting.",
            "📥 PDF Export: Generate clean, ATS-compliant, single-page resume PDFs in one click."
        ]
    }
}

const FOOTER_DETAILS = {
    privacy: {
        title: "Privacy Policy",
        desc: "At InterviewPrep.AI, we prioritize your data security and user privacy above all else.",
        sections: [
            { label: "Data Collection", text: "We parse and analyze the resume files and job descriptions you upload solely to generate mock interviews." },
            { label: "Storage & Protection", text: "Your session files and generated plans are stored securely in MongoDB Atlas using industry-standard encryption protocols." },
            { label: "AI Handling", text: "We do not sell your personal data. Input data is passed securely to our LLM endpoints via confidential pipelines." }
        ]
    },
    terms: {
        title: "Terms of Service",
        desc: "Welcome to InterviewPrep.AI. By using our service, you agree to comply with our terms of usage.",
        sections: [
            { label: "Permitted Use", text: "Our simulator is designed exclusively for educational, mock practice, and career preparation purposes." },
            { label: "Account Security", text: "Users are responsible for keeping their authentication details secure and should not share account credentials." },
            { label: "Service Continuity", text: "We aim for high uptime, but reserve the right to modify or deprecate services for essential updates." }
        ]
    },
    help: {
        title: "Help Center & FAQ",
        desc: "Have questions or need assistance? Here is how to get the most out of InterviewPrep.AI.",
        sections: [
            { label: "How to Start", text: "Log in, paste your target job description, upload a resume, and click 'Generate My Interview Strategy'." },
            { label: "Mock Simulations", text: "Practice using the Mock Interview tab. Your answers are evaluated instantly by our AI." },
            { label: "Support Contact", text: "Encountered an issue? Reach out to support at help@interviewprep.ai or check our developer resources." }
        ]
    }
}

const Home = () => {

    const { loading, generateReport, reports, getAnalytics, extractFromUrl } = useInterview()
    const { user, loading: authLoading, handleLogout } = useAuth()
    const [ selectedFeature, setSelectedFeature ] = useState(null)
    const [ selectedFooterItem, setSelectedFooterItem ] = useState(null)
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ questionCount, setQuestionCount ] = useState(5)
    const [ generating, setGenerating ] = useState(false)
    const resumeInputRef = useRef()

    const [activeSection, setActiveSection] = useState("generator") // "generator" or "analytics"
    const [analyticsData, setAnalyticsData] = useState(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)

    const [jobUrlInput, setJobUrlInput] = useState("")
    const [extractingUrl, setExtractingUrl] = useState(false)
    const [extractError, setExtractError] = useState("")

    const handleExtractUrl = async () => {
        if (!jobUrlInput.trim()) return
        setExtractingUrl(true)
        setExtractError("")
        try {
            const data = await extractFromUrl(jobUrlInput)
            if (data?.jobDescription) {
                setJobDescription(data.jobDescription)
                setJobUrlInput("")
            }
        } catch (err) {
            console.error(err)
            setExtractError("Failed to extract job description from URL. Please verify link or paste text manually.")
        } finally {
            setExtractingUrl(false)
        }
    }

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true)
        try {
            const data = await getAnalytics()
            setAnalyticsData(data)
        } catch (err) {
            console.log(err)
        } finally {
            setAnalyticsLoading(false)
        }
    }

    useEffect(() => {
        if (activeSection === "analytics") {
            fetchAnalytics()
        }
    }, [activeSection])

    const navigate = useNavigate()

    const handleUserLogout = async () => {
        await handleLogout()
        navigate('/')
    }

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current.files[ 0 ]
        setGenerating(true)
        try {
            const data = await generateReport({ jobDescription, selfDescription, resumeFile, questionCount })
            if (data?._id) {
                navigate(`/interview/${data._id}`)
            }
        } catch (e) {
            console.log(e)
        } finally {
            setGenerating(false)
        }
    }

    if (authLoading) {
        return (
            <main className='loading-screen'>
                <h1>Loading...</h1>
            </main>
        )
    }

    if (!user) {
        return (
            <div className='home-page'>
                <ThemeToggle style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000 }} />
                <div className='landing-container'>
                    {/* Hero Section */}
                    <section className='hero-section'>
                        <span className='brand-logo-large'>🎯</span>
                        <h1>Elevate Your Career with <span className='gradient-text'>InterviewPrep.AI</span></h1>
                        <p>
                            Paste any job description and upload your resume. Our AI analyzes alignment, maps out a step-by-step prep strategy, conducts mock chats, and crafts ATS-friendly bullet points tailored to the role.
                        </p>
                        <div className='cta-buttons'>
                            <Link to='/register' className='btn btn-primary'>Get Started Free</Link>
                            <Link to='/login' className='btn btn-secondary'>Sign In</Link>
                        </div>
                    </section>

                    {/* Features Grid */}
                    <section className='features-section'>
                        <div className='section-title'>
                            <h2>Features Engineered for Success</h2>
                            <p>Everything you need to stand out, prepare efficiently, and pass with flying colors.</p>
                            <span className='click-prompt' style={{ fontSize: '0.8rem', color: '#ff2d78', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>💡 Click any card below to preview detailed information</span>
                        </div>
                        <div className='features-grid'>
                            <div className='feature-card clickable' onClick={() => setSelectedFeature(FEATURE_DETAILS.ats)}>
                                <div className='feature-icon'>📊</div>
                                <h3>ATS Alignment Analysis</h3>
                                <p>Get a comprehensive alignment rating and discover key skill gaps in your profile compared directly to the job description.</p>
                            </div>
                            <div className='feature-card clickable' onClick={() => setSelectedFeature(FEATURE_DETAILS.roadmap)}>
                                <div className='feature-icon'>📅</div>
                                <h3>Custom Prep Roadmap</h3>
                                <p>Receive a structured timeline breaking down topics, checklists, and recommended study points tailored to the target role.</p>
                            </div>
                            <div className='feature-card clickable' onClick={() => setSelectedFeature(FEATURE_DETAILS.mock)}>
                                <div className='feature-icon'>🤖</div>
                                <h3>Interactive Mock Chats</h3>
                                <p>Practice technical and behavioral questions, submit answers, and get instant grading feedback, scores, and polished revisions.</p>
                            </div>
                            <div className='feature-card clickable' onClick={() => setSelectedFeature(FEATURE_DETAILS.resume)}>
                                <div className='feature-icon'>📄</div>
                                <h3>ATS Resume Customizer</h3>
                                <p>Automatically tailors your resume experiences with optimized phrasing and metrics matching the job requirements.</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Feature Detail Modal Overlay */}
                {selectedFeature && (
                    <div className='feature-modal-overlay' onClick={() => setSelectedFeature(null)}>
                        <div className='feature-modal-content' onClick={(e) => e.stopPropagation()}>
                            <button className='close-modal-btn' onClick={() => setSelectedFeature(null)}>&times;</button>
                            <div className='modal-icon'>{selectedFeature.icon}</div>
                            <h3>{selectedFeature.title}</h3>
                            <h4>{selectedFeature.subtitle}</h4>
                            <p className='modal-desc'>{selectedFeature.desc}</p>
                            <div className='modal-bullets'>
                                <h5>Key Capabilities:</h5>
                                <ul>
                                    {selectedFeature.bullets.map((bullet, idx) => (
                                        <li key={idx}>{bullet}</li>
                                    ))}
                                </ul>
                            </div>
                            <button className='btn btn-primary modal-cta-btn' onClick={() => setSelectedFeature(null)}>Got It</button>
                        </div>
                    </div>
                )}

                {/* Footer Detail Modal Overlay */}
                {selectedFooterItem && (
                    <div className='feature-modal-overlay' onClick={() => setSelectedFooterItem(null)}>
                        <div className='feature-modal-content footer-modal' onClick={(e) => e.stopPropagation()}>
                            <button className='close-modal-btn' onClick={() => setSelectedFooterItem(null)}>&times;</button>
                            <h3>{selectedFooterItem.title}</h3>
                            <p className='modal-desc'>{selectedFooterItem.desc}</p>
                            <div className='modal-sections-list' style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {selectedFooterItem.sections.map((sec, idx) => (
                                    <div key={idx} className='modal-section' style={{ textAlign: 'left', padding: '0.75rem', background: '#0d1117', border: '1px solid #21262d', borderRadius: '0.5rem' }}>
                                        <h5 style={{ fontSize: '0.85rem', color: '#ff2d78', marginBottom: '0.35rem', fontWeight: 600 }}>{sec.label}</h5>
                                        <p style={{ fontSize: '0.8rem', color: '#c9d1d9', margin: 0, lineHeight: 1.4 }}>{sec.text}</p>
                                    </div>
                                ))}
                            </div>
                            <button className='btn btn-primary modal-cta-btn' onClick={() => setSelectedFooterItem(null)}>Close</button>
                        </div>
                    </div>
                )}

                {/* Page Footer */}
                <footer className='page-footer'>
                    <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.privacy)} className='footer-link-btn'>Privacy Policy</button>
                    <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.terms)} className='footer-link-btn'>Terms of Service</button>
                    <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.help)} className='footer-link-btn'>Help Center</button>
                </footer>
            </div>
        )
    }

    if (generating) {
        return (
            <main className='loading-screen'>
                <div className='spinner-large'></div>
                <h1>Generating your interview plan...</h1>
                <p>This may take around 30 seconds. Please do not close the window.</p>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Dashboard Navigation Header */}
            <div className='dashboard-header'>
                <div className='brand'>
                    <span className='brand-logo'>🎯</span>
                    <span className='brand-name'>InterviewPrep.AI</span>
                </div>
                <div className='user-profile' style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className='user-greeting'>👋 Welcome, <strong>{user?.username}</strong></span>
                    <ThemeToggle />
                    <button onClick={handleUserLogout} className='logout-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Dashboard Tabs Toggle */}
            <div className='dashboard-tabs' style={{ display: 'flex', gap: '1rem', padding: '0 2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                <button 
                    onClick={() => setActiveSection("generator")}
                    className={`tab-btn ${activeSection === 'generator' ? 'tab-btn--active' : ''}`}
                    style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: activeSection === 'generator' ? '2px solid #ff2d78' : '2px solid transparent',
                        color: activeSection === 'generator' ? 'var(--text-primary)' : 'var(--text-muted)',
                        padding: '1rem 0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                    }}
                >
                    📁 Plan Generator
                </button>
                <button 
                    onClick={() => setActiveSection("analytics")}
                    className={`tab-btn ${activeSection === 'analytics' ? 'tab-btn--active' : ''}`}
                    style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: activeSection === 'analytics' ? '2px solid #ff2d78' : '2px solid transparent',
                        color: activeSection === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)',
                        padding: '1rem 0.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                    }}
                >
                    📊 Performance Insights
                </button>
            </div>

            {activeSection === "analytics" ? (
                <div className='analytics-dashboard' style={{ padding: '0 2rem', color: 'var(--text-primary)', maxWidth: '1200px', margin: '0 auto' }}>
                    
                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Performance Insights</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Aggregated analytics tracking your interview prep stats, score trends, and critical skill gaps.</p>
                    </div>

                    {analyticsLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                            <div className='spinner-large'></div>
                            <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Analyzing report databases...</span>
                        </div>
                    ) : analyticsData && analyticsData.stats?.totalPlans > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            
                            {/* Summary Cards */}
                            <div className='analytics-stats-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                                <div className='stat-card' style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Prep Strategies</span>
                                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ff2d78' }}>{analyticsData.stats.totalPlans}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jobs analyzed by AI</span>
                                </div>
                                <div className='stat-card' style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Match Score</span>
                                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffd700' }}>{analyticsData.stats.averageScore}%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard alignment level</span>
                                </div>
                                <div className='stat-card' style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skill Gaps Identified</span>
                                    <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{analyticsData.stats.totalSkillsIdentified}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Topics requiring study</span>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                                
                                {/* Score Trend Line Chart */}
                                <div className='chart-container' style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Match Score Progress Trend</h4>
                                    
                                    {/* Custom SVG Line Chart */}
                                    <div style={{ width: '100%', height: '240px', position: 'relative' }}>
                                        <svg viewBox="0 0 500 220" width="100%" height="100%">
                                            {/* Grid lines */}
                                            <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-color)" opacity="0.3" strokeDasharray="3" />
                                            <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" opacity="0.3" strokeDasharray="3" />
                                            <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-color)" opacity="0.3" strokeDasharray="3" />
                                            <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-color)" opacity="0.3" strokeDasharray="3" />
                                            
                                            {/* Y-Axis Labels */}
                                            <text x="10" y="25" fill="var(--text-muted)" fontSize="10">100%</text>
                                            <text x="15" y="75" fill="var(--text-muted)" fontSize="10">75%</text>
                                            <text x="15" y="125" fill="var(--text-muted)" fontSize="10">50%</text>
                                            <text x="15" y="175" fill="var(--text-muted)" fontSize="10">25%</text>

                                            {/* Draw Line & Points */}
                                            {(() => {
                                                const pointsCount = analyticsData.scoreHistory.length
                                                const widthStep = pointsCount > 1 ? (440 / (pointsCount - 1)) : 440
                                                const points = analyticsData.scoreHistory.map((item, idx) => {
                                                    const x = 40 + idx * widthStep
                                                    // Normalize score from 0-100 to fit y space from 170 down to 20
                                                    const y = 170 - ((item.matchScore / 100) * 150)
                                                    return { x, y, score: item.matchScore, title: item.title }
                                                })

                                                const pathD = points.reduce((acc, p, idx) => {
                                                    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                                                }, "")

                                                return (
                                                    <>
                                                        {/* Gradient Area under line */}
                                                        {pointsCount > 0 && (
                                                            <path
                                                                d={`${pathD} L ${points[pointsCount - 1].x} 170 L ${points[0].x} 170 Z`}
                                                                fill="url(#score-gradient)"
                                                                opacity="0.15"
                                                            />
                                                        )}
                                                        
                                                        {/* Definitions */}
                                                        <defs>
                                                            <linearGradient id="score-gradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#ff2d78" />
                                                                <stop offset="100%" stopColor="#ff2d78" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>

                                                        {/* The Line */}
                                                        <path d={pathD} fill="none" stroke="#ff2d78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                                        {/* Circle Points */}
                                                        {points.map((p, idx) => (
                                                            <g key={idx} className="chart-point-group">
                                                                <circle 
                                                                    cx={p.x} 
                                                                    cy={p.y} 
                                                                    r="5" 
                                                                    fill="#ff2d78" 
                                                                    stroke="var(--bg-card)" 
                                                                    strokeWidth="2" 
                                                                />
                                                                <title>{p.title}: {p.score}%</title>
                                                                <text x={p.x} y={p.y - 10} fill="var(--text-primary)" fontSize="8" textAnchor="middle" fontWeight="bold">{p.score}%</text>
                                                            </g>
                                                        ))}
                                                    </>
                                                )
                                            })()}
                                        </svg>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center', marginTop: '0.5rem' }}>Sequential Plan Executions</span>
                                </div>

                                {/* Skills Gap Frequency Bar Chart */}
                                <div className='chart-container' style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <h4 style={{ color: 'var(--text-primary)', margin: '0 0 1.5rem 0', fontSize: '1rem', fontWeight: 600 }}>Top Technical Skill Gaps Identified</h4>
                                    
                                    {analyticsData.topSkills?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '240px', justifyContent: 'center' }}>
                                            {analyticsData.topSkills.map((item, idx) => {
                                                const maxCount = analyticsData.topSkills[0].count
                                                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                                                return (
                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                            <span style={{ fontWeight: 600 }}>{item.skill}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>Flagged {item.count} time(s)</span>
                                                        </div>
                                                        <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--border-color) 100%)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#8b949e', fontSize: '0.85rem' }}>
                                            No skill gaps flagged yet!
                                        </div>
                                    )}
                                </div>

                            </div>
                            
                            {/* Question Type Distribution Card */}
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Question Coverage Breakdown</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '240px' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                                            Proportion of mock questions analyzed and generated by AI categories across your technical capabilities and behavioral framework profiles.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <span style={{ width: '12px', height: '12px', background: '#ff2d78', borderRadius: '50%' }}></span>
                                                <span>Technical: <strong>{analyticsData.questionDistribution.technical}</strong> Qs</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <span style={{ width: '12px', height: '12px', background: '#ffd700', borderRadius: '50%' }}></span>
                                                <span>Behavioral: <strong>{analyticsData.questionDistribution.behavioral}</strong> Qs</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Donut progress visual */}
                                    {(() => {
                                        const tech = analyticsData.questionDistribution.technical || 0
                                        const behav = analyticsData.questionDistribution.behavioral || 0
                                        const total = tech + behav
                                        const dasharray = total > 0 ? (tech / total) * 314 : 157
                                        const dashoffset = 314 - dasharray
                                        return (
                                            <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="120" height="120" viewBox="0 0 120 120">
                                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#ffd700" strokeWidth="12" />
                                                    <circle 
                                                        cx="60" 
                                                        cy="60" 
                                                        r="50" 
                                                        fill="none" 
                                                        stroke="#ff2d78" 
                                                        strokeWidth="12" 
                                                        strokeDasharray="314.16"
                                                        strokeDashoffset={dashoffset}
                                                        transform="rotate(-90 60 60)"
                                                    />
                                                    <text x="60" y="65" fill="var(--text-primary)" fontSize="11" textAnchor="middle" fontWeight="bold">
                                                        {total} Total Qs
                                                    </text>
                                                </svg>
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
                            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📈</span>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Analytics Data Yet</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem auto', lineHeight: 1.4 }}>
                                Generate your first interview strategy plan using the tab above to display performance progression trends.
                            </p>
                            <button onClick={() => setActiveSection("generator")} className='btn btn-primary'>Create Prep Plan</button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Page Header */}
                    <header className='page-header'>
                        <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                        <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
                    </header>

                    {/* Main Card */}
                    <div className='interview-card'>
                        <div className='interview-card__body'>

                            {/* Left Panel - Job Description */}
                            <div className='panel panel--left'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                                    </span>
                                    <h2>Target Job Description</h2>
                                    <span className='badge badge--required'>Required</span>
                                </div>

                                {/* URL Auto-Extractor Bar */}
                                <div className="url-extractor-box" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <label style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                                        ⚡ Import directly from Job URL
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            type="url"
                                            placeholder="Paste URL (e.g. LinkedIn, Indeed, Google Careers)"
                                            value={jobUrlInput}
                                            onChange={(e) => setJobUrlInput(e.target.value)}
                                            style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: '0.35rem', padding: '0.4rem 0.6rem', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                                        />
                                        <button 
                                            type="button"
                                            onClick={handleExtractUrl}
                                            disabled={extractingUrl}
                                            style={{ background: '#ff2d78', border: 'none', borderRadius: '0.35rem', color: '#fff', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.2s', opacity: extractingUrl ? 0.7 : 1 }}
                                        >
                                            {extractingUrl ? (
                                                <>
                                                    <span className="spinner-small" style={{ width: '12px', height: '12px' }}></span>
                                                    Scraping...
                                                </>
                                            ) : (
                                                <>🔗 Auto-Extract</>
                                            )}
                                        </button>
                                    </div>
                                    {extractError && (
                                        <span style={{ color: '#ff7b72', fontSize: '0.7rem', marginTop: '0.35rem', display: 'block' }}>{extractError}</span>
                                    )}
                                </div>

                                {/* OR Divider */}
                                <div className='or-divider'><span>OR</span></div>

                                {/* Manual Job Description Input */}
                                <div className='manual-job-description'>
                                    <label className='section-label'>
                                        Write Job Description Manually
                                    </label>
                                    <textarea
                                        onChange={(e) => { setJobDescription(e.target.value) }}
                                        value={jobDescription}
                                        className='panel__textarea'
                                        placeholder={`Paste or write the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                                        maxLength={5000}
                                    />
                                </div>
                                <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                            </div>

                            {/* Vertical Divider */}
                            <div className='panel-divider' />

                            {/* Right Panel - Profile */}
                            <div className='panel panel--right'>
                                <div className='panel__header'>
                                    <span className='panel__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </span>
                                    <h2>Your Profile</h2>
                                </div>

                                {/* Upload Resume */}
                                <div className='upload-section'>
                                    <label className='section-label'>
                                        Upload Resume
                                        <span className='badge badge--best'>Best Results</span>
                                    </label>
                                    <label className='dropzone' htmlFor='resume'>
                                        <span className='dropzone__icon'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                        </span>
                                        <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                        <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                        <input ref={resumeInputRef} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' />
                                    </label>
                                </div>

                                {/* OR Divider */}
                                <div className='or-divider'><span>OR</span></div>

                                {/* Quick Self-Description */}
                                <div className='self-description'>
                                    <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                                    <textarea
                                        onChange={(e) => { setSelfDescription(e.target.value) }}
                                        id='selfDescription'
                                        name='selfDescription'
                                        className='panel__textarea panel__textarea--short'
                                        placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                    />
                                </div>

                                {/* Info Box */}
                                <div className='info-box'>
                                    <span className='info-box__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                                    </span>
                                    <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card Options */}
                        <div className='interview-card__options'>
                            <div className='options-label'>
                                <span>💬 Number of Mock Questions to Generate:</span>
                            </div>
                            <select 
                                value={questionCount} 
                                onChange={(e) => setQuestionCount(Number(e.target.value))}
                                className='options-select'
                            >
                                <option value={3}>3 Questions (Fast)</option>
                                <option value={5}>5 Questions (Standard)</option>
                                <option value={10}>10 Questions (Comprehensive)</option>
                                <option value={15}>15 Questions (Deep Prep)</option>
                            </select>
                        </div>

                        {/* Card Footer */}
                        <div className='interview-card__footer'>
                            <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                            <button
                                onClick={handleGenerateReport}
                                className='generate-btn'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                                Generate My Interview Strategy
                            </button>
                        </div>
                    </div>

                    {/* Recent Reports List */}
                    <section className='recent-reports'>
                        <h2>My Recent Interview Plans</h2>
                        {loading ? (
                            <div className='reports-loading-spinner' style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7d8590', fontSize: '0.85rem', padding: '1rem 0' }}>
                                <div className='spinner-small'></div>
                                <span>Loading recent plans...</span>
                            </div>
                        ) : reports.length > 0 ? (
                            <ul className='reports-list'>
                                {reports.map(report => (
                                    <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                        <h3>{report.title || 'Untitled Position'}</h3>
                                        <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                        <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className='no-reports-msg' style={{ color: '#7d8590', fontSize: '0.85rem', margin: 0, padding: '0.5rem 0' }}>No plans generated yet. Create one above to get started!</p>
                        )}
                    </section>
                </>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.privacy)} className='footer-link-btn'>Privacy Policy</button>
                <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.terms)} className='footer-link-btn'>Terms of Service</button>
                <button onClick={() => setSelectedFooterItem(FOOTER_DETAILS.help)} className='footer-link-btn'>Help Center</button>
            </footer>

            {/* Footer Detail Modal Overlay */}
            {selectedFooterItem && (
                <div className='feature-modal-overlay' onClick={() => setSelectedFooterItem(null)}>
                    <div className='feature-modal-content footer-modal' onClick={(e) => e.stopPropagation()}>
                        <button className='close-modal-btn' onClick={() => setSelectedFooterItem(null)}>&times;</button>
                        <h3>{selectedFooterItem.title}</h3>
                        <p className='modal-desc'>{selectedFooterItem.desc}</p>
                        <div className='modal-sections-list' style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {selectedFooterItem.sections.map((sec, idx) => (
                                <div key={idx} className='modal-section' style={{ textAlign: 'left', padding: '0.75rem', background: '#0d1117', border: '1px solid #21262d', borderRadius: '0.5rem' }}>
                                    <h5 style={{ fontSize: '0.85rem', color: '#ff2d78', marginBottom: '0.35rem', fontWeight: 600 }}>{sec.label}</h5>
                                    <p style={{ fontSize: '0.8rem', color: '#c9d1d9', margin: 0, lineHeight: 1.4 }}>{sec.text}</p>
                                </div>
                            ))}
                        </div>
                        <button className='btn btn-primary modal-cta-btn' onClick={() => setSelectedFooterItem(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home