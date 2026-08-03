import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'
import PracticeSession from '../components/PracticeSession'
import FlashcardsDeck from '../components/FlashcardsDeck'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'flashcards', label: '3D Flashcards', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>) },
    { id: 'practice', label: 'AI Mock Interview', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" x2="12" y1="17" y2="22"/></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, isBehavioral, interviewId, submitStarStory, submitCode }) => {
    const [ open, setOpen ] = useState(false)
    const [ situation, setSituation ] = useState(item.starStory?.situation || "")
    const [ task, setTask ] = useState(item.starStory?.task || "")
    const [ action, setAction ] = useState(item.starStory?.action || "")
    const [ result, setResult ] = useState(item.starStory?.result || "")
    
    const [ showBuilder, setShowBuilder ] = useState(!!item.starStory?.feedback)
    const [ analyzing, setAnalyzing ] = useState(false)

    // Code Sandbox State
    const [ code, setCode ] = useState(item.codeSandbox?.code || "")
    const [ language, setLanguage ] = useState(item.codeSandbox?.language || "javascript")
    const [ showCodeSandbox, setShowCodeSandbox ] = useState(!!item.codeSandbox?.critique)
    const [ compiling, setCompiling ] = useState(false)

    // Sync input state if the item (report/refresh) updates
    useEffect(() => {
        if (item.starStory) {
            setSituation(item.starStory.situation || "")
            setTask(item.starStory.task || "")
            setAction(item.starStory.action || "")
            setResult(item.starStory.result || "")
            setShowBuilder(!!item.starStory.feedback)
        }
        if (item.codeSandbox) {
            setCode(item.codeSandbox.code || "")
            setLanguage(item.codeSandbox.language || "javascript")
            setShowCodeSandbox(!!item.codeSandbox.critique)
        }
    }, [item])

    const handleAnalyzeStory = async () => {
        if (analyzing) return
        setAnalyzing(true)
        try {
            await submitStarStory(interviewId, index, { situation, task, action, result })
        } catch (e) {
            console.error(e)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleAnalyzeCode = async () => {
        if (compiling) return
        setCompiling(true)
        try {
            await submitCode(interviewId, index, { code, language })
        } catch (e) {
            console.error(e)
        } finally {
            setCompiling(false)
        }
    }

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>

                    {isBehavioral && (
                        <div className='star-builder'>
                            <button 
                                type="button" 
                                className='star-builder__toggle-btn'
                                onClick={() => setShowBuilder(b => !b)}
                            >
                                {showBuilder ? '📖 Hide STAR Story Practice' : '✍️ Practice with STAR Story Builder'}
                            </button>

                            {showBuilder && (
                                <div className='star-builder__form'>
                                    <h4 className='star-builder__title'>Build Your Story using STAR Method</h4>
                                    <p className='star-builder__desc'>
                                        Fill in each section of your scenario. We will send it to the AI to grade your delivery, detail structural improvements, and provide a polished model rewrite.
                                    </p>

                                    <div className='star-builder__field'>
                                        <label>Situation (The Context)</label>
                                        <textarea
                                            placeholder="What was the situation? E.g., 'During my internship at Google, we encountered a production bug causing 10% data packet drops...'"
                                            value={situation}
                                            onChange={(e) => setSituation(e.target.value)}
                                        />
                                    </div>

                                    <div className='star-builder__field'>
                                        <label>Task (The Challenge)</label>
                                        <textarea
                                            placeholder="What challenge did you need to address? E.g., 'I was tasked with diagnosing the bottleneck and patching the core RPC pipeline...'"
                                            value={task}
                                            onChange={(e) => setTask(e.target.value)}
                                        />
                                    </div>

                                    <div className='star-builder__field'>
                                        <label>Action (Your Execution)</label>
                                        <textarea
                                            placeholder="What specific actions did YOU take? E.g., 'I wrote automated scripts to mock loads, traced connections via Wireshark, and restructured serialization logic...'"
                                            value={action}
                                            onChange={(e) => setAction(e.target.value)}
                                        />
                                    </div>

                                    <div className='star-builder__field'>
                                        <label>Result (The Quantifiable Outcome)</label>
                                        <textarea
                                            placeholder="What was the result? E.g., 'I reduced drops to 0%, optimized network latency by 15%, and successfully launched on schedule...'"
                                            value={result}
                                            onChange={(e) => setResult(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAnalyzeStory}
                                        disabled={analyzing || !situation || !task || !action || !result}
                                        className='star-builder__submit-btn'
                                    >
                                        {analyzing ? (
                                            <>
                                                <span className="spinner-small" style={{ borderTopColor: '#fff', width: '12px', height: '12px', marginRight: '0.5rem', display: 'inline-block' }}></span>
                                                Analyzing &amp; Grading Story...
                                            </>
                                        ) : (
                                            <>✨ Analyze &amp; Save STAR Story</>
                                        )}
                                    </button>

                                    {/* Evaluation Results */}
                                    {item.starStory?.feedback && (
                                        <div className='star-feedback'>
                                            <div className='star-feedback__header'>
                                                <h5>AI Evaluation Report</h5>
                                                <div className='star-feedback__score'>
                                                    <span>Score:</span>
                                                    <strong>{item.starStory.score}/100</strong>
                                                </div>
                                            </div>
                                            
                                            <div className='star-feedback__section'>
                                                <h6>Critique &amp; Feedback:</h6>
                                                <p>{item.starStory.feedback}</p>
                                            </div>

                                            <div className='star-feedback__section star-feedback__section--rewrite'>
                                                <h6>Polished Story Rewrite:</h6>
                                                <p>{item.starStory.improvedVersion}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!isBehavioral && (
                        <div className='code-sandbox'>
                            <button 
                                type="button" 
                                className='code-sandbox__toggle-btn'
                                onClick={() => setShowCodeSandbox(b => !b)}
                            >
                                {showCodeSandbox ? '📖 Hide Code Sandbox' : '💻 Practice in Code Sandbox'}
                            </button>

                            {showCodeSandbox && (
                                <div className='code-sandbox__form'>
                                    <div className='code-sandbox__form-header'>
                                        <h4 className='code-sandbox__title'>Code Editor Sandbox</h4>
                                        <select 
                                            value={language} 
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className='code-sandbox__lang-select'
                                        >
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                            <option value="cpp">C++</option>
                                            <option value="java">Java</option>
                                        </select>
                                    </div>
                                    <p className='code-sandbox__desc'>
                                        Write your solution code below. We will send it to the AI to verify correctness, analyze time/space complexity, and provide a refactored code review.
                                    </p>

                                    <div className='code-sandbox__editor-container'>
                                        <textarea
                                            placeholder={`// Write your ${language} solution here...`}
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className='code-sandbox__textarea'
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAnalyzeCode}
                                        disabled={compiling || !code.trim()}
                                        className='code-sandbox__submit-btn'
                                    >
                                        {compiling ? (
                                            <>
                                                <span className="spinner-small" style={{ borderTopColor: '#fff', width: '12px', height: '12px', marginRight: '0.5rem', display: 'inline-block' }}></span>
                                                Running &amp; Compiling Code...
                                            </>
                                        ) : (
                                            <>✨ Run &amp; Analyze Code</>
                                        )}
                                    </button>

                                    {/* Evaluation Results */}
                                    {item.codeSandbox?.critique && (
                                        <div className='code-feedback'>
                                            <div className='code-feedback__header'>
                                                <h5>AI Code Review Report</h5>
                                                <div className='code-feedback__status'>
                                                    <span className={`status-tag ${item.codeSandbox.isCorrect ? 'status-tag--correct' : 'status-tag--incorrect'}`}>
                                                        {item.codeSandbox.isCorrect ? '✔ Correct Solution' : '❌ Has Bugs / Incomplete'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className='code-feedback__complexities'>
                                                <div className='complexity-badge'>
                                                    <span>Time Complexity:</span>
                                                    <strong>{item.codeSandbox.timeComplexity}</strong>
                                                </div>
                                                <div className='complexity-badge'>
                                                    <span>Space Complexity:</span>
                                                    <strong>{item.codeSandbox.spaceComplexity}</strong>
                                                </div>
                                            </div>
                                            
                                            <div className='code-feedback__section'>
                                                <h6>Critique &amp; Suggestions:</h6>
                                                <p>{item.codeSandbox.critique}</p>
                                            </div>

                                            <div className='code-feedback__section code-feedback__section--refactored'>
                                                <h6>Polished Refactored Solution:</h6>
                                                <pre className='code-syntax-display'>
                                                    <code>{item.codeSandbox.refactoredCode}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const TalentNode = ({ day, status, active, onClick }) => {
    // status can be: 'completed', 'unlocked', 'locked'
    const getIcon = () => {
        if (status === 'completed') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )
        }
        if (status === 'locked') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            )
        }
        // active/unlocked
        return <span className="node-day-num">{day.day}</span>
    }

    return (
        <button
            type="button"
            className={`talent-node talent-node--${status} ${active ? 'talent-node--active' : ''}`}
            onClick={onClick}
            disabled={status === 'locked'}
        >
            <div className="talent-node__inner">
                {getIcon()}
            </div>
            <div className="talent-node__label">{day.focus}</div>
        </button>
    )
}

const TalentPanel = ({ day, isCompleted, isUnlocked, interviewId, toggleDay, onToggleSuccess }) => {
    const [ localCompletedTasks, setLocalCompletedTasks ] = useState({})
    const [ toggling, setToggling ] = useState(false)

    // Reset local completed tasks state when the selected day changes
    useEffect(() => {
        setLocalCompletedTasks({})
    }, [ day ])

    const handleTaskChange = (idx, checked) => {
        setLocalCompletedTasks(prev => ({
            ...prev,
            [idx]: checked
        }))
    }

    const allTasksChecked = day.tasks.every((_, idx) => {
        // If the day is already marked completed, all tasks are visually checked
        if (isCompleted) return true
        return !!localCompletedTasks[idx]
    })

    const handleCompleteDay = async () => {
        setToggling(true)
        try {
            await toggleDay(interviewId, day.day)
            if (onToggleSuccess) onToggleSuccess()
        } catch (err) {
            console.log(err)
        } finally {
            setToggling(false)
        }
    }

    return (
        <div className="talent-panel">
            <div className="talent-panel__header">
                <span className="talent-panel__badge">Day {day.day} Node Details</span>
                <h3 className="talent-panel__title">{day.focus}</h3>
            </div>

            <div className="talent-panel__body">
                <h4 className="talent-panel__section-title">Focus Checklist</h4>
                <ul className="talent-panel__checklist">
                    {day.tasks.map((task, idx) => {
                        const isChecked = isCompleted || !!localCompletedTasks[idx]
                        return (
                            <li key={idx} className={`talent-panel__task ${isChecked ? 'talent-panel__task--checked' : ''}`}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isCompleted}
                                        onChange={(e) => handleTaskChange(idx, e.target.checked)}
                                    />
                                    <span>{task}</span>
                                </label>
                            </li>
                        )
                    })}
                </ul>
            </div>

            <div className="talent-panel__footer">
                <button
                    type="button"
                    onClick={handleCompleteDay}
                    disabled={toggling || (!isUnlocked && !isCompleted) || (!isCompleted && !allTasksChecked)}
                    className={`talent-panel__btn ${isCompleted ? 'talent-panel__btn--incomplete' : 'talent-panel__btn--complete'}`}
                >
                    {toggling ? (
                        <span className="spinner-small" style={{ width: '14px', height: '14px' }}></span>
                    ) : isCompleted ? (
                        <>🔓 Re-lock Day Node</>
                    ) : (
                        <>✨ Complete Node &amp; Level Up</>
                    )}
                </button>
                {!isCompleted && !allTasksChecked && (
                    <p className="talent-panel__hint">Check off all tasks above to unlock the next level.</p>
                )}
            </div>
        </div>
    )
}

const RoadMapTree = ({ plan, completedDays = [], interviewId, toggleDay }) => {
    // Default selected day to the first incomplete day
    const firstIncompleteDay = plan.find(d => !completedDays.includes(d.day))?.day || plan[0]?.day
    const [ selectedDay, setSelectedDay ] = useState(firstIncompleteDay)

    useEffect(() => {
        // Auto-select the first incomplete day if plan or completedDays updates
        const nextIncomplete = plan.find(d => !completedDays.includes(d.day))?.day || plan[0]?.day
        setSelectedDay(nextIncomplete)
    }, [completedDays, plan])

    const selectedDayData = plan.find(d => d.day === selectedDay) || plan[0]

    // Calculate percentage completion for the glowing center cable
    const completedCount = completedDays.filter(d => plan.some(p => p.day === d)).length
    const completionPercent = plan.length > 0 ? (completedCount / plan.length) * 100 : 0

    return (
        <div className="talent-tree-container">
            <div className="talent-tree-view">
                <h4 className="talent-tree-view__title">Interactive RPG Skill Path</h4>
                <p className="talent-tree-view__desc">
                    Click on unlocked skill nodes to view daily focus details and complete them to level up and reveal the next node.
                </p>

                <div className="talent-tree-view__canvas">
                    {/* Glowing vertical timeline cable */}
                    <div className="talent-tree-view__cable-bg" />
                    <div 
                        className="talent-tree-view__cable-active" 
                        style={{ height: `${completionPercent}%` }}
                    />

                    {/* Render days as alternate winding nodes */}
                    <div className="talent-nodes-list">
                        {plan.map((day, idx) => {
                            const isCompleted = completedDays.includes(day.day)
                            const isUnlocked = day.day === 1 || completedDays.includes(day.day - 1)
                            const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked'

                            // Offset formula to wind alternate nodes left/center/right
                            const offsetClass = idx % 3 === 0 ? 'offset-center' : idx % 3 === 1 ? 'offset-left' : 'offset-right'

                            return (
                                <div key={day.day} className={`talent-node-wrapper ${offsetClass}`}>
                                    <TalentNode
                                        day={day}
                                        status={status}
                                        active={selectedDay === day.day}
                                        onClick={() => setSelectedDay(day.day)}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {selectedDayData && (
                <TalentPanel
                    day={selectedDayData}
                    isCompleted={completedDays.includes(selectedDayData.day)}
                    isUnlocked={selectedDayData.day === 1 || completedDays.includes(selectedDayData.day - 1)}
                    interviewId={interviewId}
                    toggleDay={toggleDay}
                />
            )}
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf, refreshQuestions, submitStarStory, toggleDay, submitCode } = useInterview()
    const { user, handleLogout, handleUpgrade } = useAuth()
    const navigate = useNavigate()
    const { interviewId } = useParams()

    const [ refreshing, setRefreshing ] = useState(null) // null, 'technical', or 'behavioral'

    const handleRefresh = async (type) => {
        if (refreshing) return
        setRefreshing(type)
        try {
            await refreshQuestions(interviewId, type)
        } catch (err) {
            console.log(err)
        } finally {
            setRefreshing(null)
        }
    }

    const [showUpiModal, setShowUpiModal] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleVerifyUpiPayment = async () => {
        setIsVerifying(true)
        setTimeout(async () => {
            try {
                await handleUpgrade()
                setPaymentSuccess(true)
            } catch (err) {
                console.log(err)
            } finally {
                setIsVerifying(false)
            }
        }, 3500)
    }

    const handleCloseSuccessModal = () => {
        setPaymentSuccess(false)
        setShowUpiModal(false)
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [ interviewId ])



    const isStale = report && report._id !== interviewId
    const isLoadingOrStale = loading || !report || isStale

    const scoreColor =
        report?.matchScore >= 80 ? 'score--high' :
            report?.matchScore >= 60 ? 'score--mid' : 'score--low'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <button
                            className='interview-nav__item'
                            onClick={() => navigate('/')}
                            style={{ marginBottom: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.03)' }}
                        >
                            <span className='interview-nav__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            </span>
                            Back to Dashboard
                        </button>

                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="nav-footer" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={async () => {
                                setIsDownloading(true)
                                try {
                                    await getResumePdf(interviewId)
                                } catch (e) {
                                    console.log(e)
                                } finally {
                                    setIsDownloading(false)
                                }
                            }}
                            disabled={isDownloading}
                            className='button primary-button' 
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isDownloading ? (
                                <>
                                    <div className='spinner-small' style={{ borderTopColor: '#fff', width: '12px', height: '12px', marginRight: '0.5rem', display: 'inline-block' }}></div>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                                    Download Resume
                                </>
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                await handleLogout()
                                navigate('/')
                            }}
                            className='interview-nav__item'
                            style={{ border: '1px solid rgba(255, 45, 120, 0.25)', color: '#ff2d78', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <span className='interview-nav__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                            </span>
                            Logout
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {isLoadingOrStale ? (
                        <div className='content-loader-inline' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '400px', gap: '1rem', color: '#7d8590' }}>
                            <div className='spinner-large'></div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e6edf3' }}>Loading your interview plan...</h2>
                        </div>
                    ) : (
                        <>
                            {activeNav === 'technical' && (
                                <section>
                                    <div className='content-header'>
                                        <h2>Technical Questions</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                                            <button 
                                                onClick={() => handleRefresh('technical')}
                                                disabled={!!refreshing}
                                                className='refresh-questions-btn'
                                            >
                                                {refreshing === 'technical' ? (
                                                    <>
                                                        <span className="spinner-small" style={{ width: '12px', height: '12px' }}></span>
                                                        Regenerating...
                                                    </>
                                                ) : (
                                                    <>🔄 Refresh Questions</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className='q-list'>
                                        {report.technicalQuestions.map((q, i) => (
                                            <QuestionCard 
                                                key={i} 
                                                item={q} 
                                                index={i} 
                                                isBehavioral={false}
                                                interviewId={interviewId}
                                                submitStarStory={submitStarStory}
                                                submitCode={submitCode}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeNav === 'behavioral' && (
                                <section>
                                    <div className='content-header'>
                                        <h2>Behavioral Questions</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                                            <button 
                                                onClick={() => handleRefresh('behavioral')}
                                                disabled={!!refreshing}
                                                className='refresh-questions-btn'
                                            >
                                                {refreshing === 'behavioral' ? (
                                                    <>
                                                        <span className="spinner-small" style={{ width: '12px', height: '12px' }}></span>
                                                        Regenerating...
                                                    </>
                                                ) : (
                                                    <>🔄 Refresh Questions</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className='q-list'>
                                        {report.behavioralQuestions.map((q, i) => (
                                            <QuestionCard 
                                                key={i} 
                                                item={q} 
                                                index={i} 
                                                isBehavioral={true}
                                                interviewId={interviewId}
                                                submitStarStory={submitStarStory}
                                                submitCode={submitCode}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeNav === 'roadmap' && (
                                <section>
                                    <div className='content-header'>
                                        <h2>Preparation Road Map</h2>
                                        <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                                    </div>
                                    <RoadMapTree
                                        plan={report.preparationPlan}
                                        completedDays={report.completedDays || []}
                                        interviewId={interviewId}
                                        toggleDay={toggleDay}
                                    />
                                </section>
                            )}

                            {activeNav === 'flashcards' && (
                                <section>
                                    <FlashcardsDeck report={report} />
                                </section>
                            )}

                            {activeNav === 'practice' && (
                                <section>
                                    <div className='content-header'>
                                        <h2>AI Mock Interview Simulator</h2>
                                        <span className='content-header__count'>Practice Mode</span>
                                    </div>
                                    {!user?.isPremium ? (
                                        <div className='premium-paywall-card' style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.9) 0%, rgba(13, 17, 23, 0.9) 100%)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '1rem', textAlign: 'center', marginTop: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                                            <div className='premium-glow-effect' style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                                            <div className='premium-badge-icon' style={{ fontSize: '3.5rem', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }}>👑</div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffd700', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Unlock AI Mock Interviews</h3>
                                            <p style={{ fontSize: '0.9rem', color: '#8b949e', maxWidth: '450px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
                                                Upgrade to premium to practice technical and behavioral mock rounds with real-time feedback, verbal follow-ups, and instant performance grading.
                                            </p>
                                            
                                            <div className='premium-features-list' style={{ textAlign: 'left', maxWidth: '380px', margin: '0 auto 2rem auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#c9d1d9' }}>⚡ <strong>Unlimited Rounds</strong>: Practice as many times as you need</div>
                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#c9d1d9' }}>🎤 <strong>Voice & Text</strong>: Interactive mock simulation</div>
                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#c9d1d9' }}>📊 <strong>Grading Rubrics</strong>: Detailed answers score breakdown</div>
                                            </div>

                                            <div className='price-tag' style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f0f6fc', marginBottom: '1.5rem' }}>
                                                ₹999 <span style={{ fontSize: '0.9rem', color: '#8b949e', fontWeight: 500 }}>/ month</span>
                                            </div>

                                            <button onClick={() => setShowUpiModal(true)} className='btn btn-primary premium-upgrade-btn' style={{ background: 'linear-gradient(135deg, #ffd700 0%, #d4af37 100%)', color: '#161b22', border: 'none', fontWeight: 700, padding: '0.8rem 2rem', borderRadius: '0.5rem', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,215,0,0.3)', transition: 'all 0.2s' }}>
                                                Upgrade to Premium
                                            </button>
                                        </div>
                                    ) : (
                                        <PracticeSession report={report} />
                                    )}
                                </section>
                            )}
                        </>
                    )}
                </main>

                {!isLoadingOrStale && activeNav !== 'practice' && <div className='interview-divider' />}

                {/* ── Right Sidebar ── */}
                {!isLoadingOrStale && activeNav !== 'practice' && (
                    <aside className='interview-sidebar'>

                        {/* Match Score */}
                        <div className='match-score'>
                            <p className='match-score__label'>Match Score</p>
                            <div className={`match-score__ring ${scoreColor}`}>
                                <span className='match-score__value'>{report.matchScore}</span>
                                <span className='match-score__pct'>%</span>
                            </div>
                            <p className='match-score__sub'>Strong match for this role</p>
                        </div>

                        <div className='sidebar-divider' />

                        {/* Skill Gaps */}
                        <div className='skill-gaps'>
                            <p className='skill-gaps__label'>Skill Gaps</p>
                            <div className='skill-gaps__list'>
                                {report.skillGaps.map((gap, i) => (
                                    <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                        {gap.skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </aside>
                )}
            </div>

            {/* UPI Payment Modal Overlay */}
            {showUpiModal && (
                <div className='feature-modal-overlay' onClick={() => { if (!isVerifying) setShowUpiModal(false) }}>
                    <div className='feature-modal-content upi-payment-modal' onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '2rem' }}>
                        <button className='close-modal-btn' onClick={() => { if (!isVerifying) setShowUpiModal(false) }} style={{ display: isVerifying || paymentSuccess ? 'none' : 'block' }}>&times;</button>
                        
                        {!paymentSuccess ? (
                            <>
                                <h3 style={{ color: '#ffd700', fontSize: '1.35rem', marginBottom: '0.25rem' }}>UPI Payment Gateway</h3>
                                <p style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '1.25rem', textAlign: 'center' }}>Scan to pay ₹999 for Premium access</p>
                                
                                <div className='qr-container' style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    <img 
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3Dinterviewprep%40upi%26pn%3DInterviewPrep.AI%26am%3D999%26cu%3DINR%26tn%3DPremium%2520Subscription" 
                                        alt="UPI Payment QR Code" 
                                        style={{ width: '180px', height: '180px', display: 'block' }}
                                    />
                                </div>

                                <div className='upi-instructions' style={{ width: '100%', fontSize: '0.8rem', color: '#c9d1d9', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxSizing: 'border-box' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#ffd700' }}>1.</span> Open Google Pay, PhonePe, or Paytm</div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#ffd700' }}>2.</span> Scan this QR code and complete transfer</div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: '#ffd700' }}>3.</span> Enter your UPI PIN to transfer ₹999</div>
                                </div>

                                <button 
                                    onClick={handleVerifyUpiPayment} 
                                    disabled={isVerifying}
                                    className='btn btn-primary' 
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', background: 'linear-gradient(135deg, #2ea44f 0%, #22863a 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(46,164,79,0.2)' }}
                                >
                                    {isVerifying ? (
                                        <>
                                            <div className='spinner-small' style={{ borderTopColor: '#fff', width: '14px', height: '14px' }}></div>
                                            Checking Status...
                                        </>
                                    ) : (
                                        <>
                                            ✅ I Have Completed the Payment
                                        </>
                                    )}
                                </button>
                                
                                {isVerifying && (
                                    <span style={{ fontSize: '0.75rem', color: '#ff2d78', marginTop: '0.75rem', textAlign: 'center' }}>
                                        🔍 Verifying UPI transaction reference on BHIM network...
                                    </span>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
                                <h3 style={{ color: '#2ea44f', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful!</h3>
                                <p style={{ fontSize: '0.85rem', color: '#8b949e', marginBottom: '1.5rem', maxWidth: '300px', lineHeight: 1.4 }}>
                                    Thank you! Your account has been upgraded to Premium. You now have full access to Mock Interviews.
                                </p>
                                <button 
                                    onClick={handleCloseSuccessModal} 
                                    className='btn btn-primary' 
                                    style={{ width: '100%', maxWidth: '200px', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700 }}
                                >
                                    Start Practicing
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Interview