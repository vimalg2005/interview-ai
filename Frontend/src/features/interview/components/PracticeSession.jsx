import React, { useState } from 'react'
import { evaluatePracticeAnswer } from '../services/interview.api'

const PracticeSession = ({ report }) => {
    // Combine technical and behavioral questions for the practice list
    const questions = [
        ...report.technicalQuestions.map(q => ({ ...q, type: 'Technical' })),
        ...report.behavioralQuestions.map(q => ({ ...q, type: 'Behavioral' }))
    ]

    const [ selectedIndex, setSelectedIndex ] = useState(0)
    const [ userAnswer, setUserAnswer ] = useState("")
    const [ loading, setLoading ] = useState(false)
    const [ result, setResult ] = useState(null)
    const [ error, setError ] = useState("")

    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const currentQuestion = questions[selectedIndex]

    // Text to Speech (Read Question Aloud)
    const speakQuestion = () => {
        if ('speechSynthesis' in window) {
            if (isSpeaking) {
                window.speechSynthesis.cancel()
                setIsSpeaking(false)
                return
            }

            const utterance = new SpeechSynthesisUtterance(currentQuestion.question)
            utterance.onend = () => setIsSpeaking(false)
            utterance.onerror = () => setIsSpeaking(false)
            setIsSpeaking(true)
            window.speechSynthesis.speak(utterance)
        } else {
            alert("Text-to-Speech is not supported in this browser.")
        }
    }

    // Speech to Text (Transcribe Response)
    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser. Please try using Google Chrome or Microsoft Edge.")
            return
        }

        if (isListening) {
            if (window.activeRecognition) {
                window.activeRecognition.stop()
            }
            setIsListening(false)
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error)
            setIsListening(false)
        }

        recognition.onresult = (event) => {
            let currentText = ""
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    currentText += event.results[i][0].transcript + " "
                }
            }
            if (currentText) {
                setUserAnswer(prev => prev + currentText)
            }
        }

        window.activeRecognition = recognition
        recognition.start()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!userAnswer.trim()) return

        if (window.speechSynthesis) window.speechSynthesis.cancel()
        if (window.activeRecognition) window.activeRecognition.stop()
        setIsSpeaking(false)
        setIsListening(false)

        setLoading(true)
        setError("")
        setResult(null)

        try {
            const data = await evaluatePracticeAnswer({
                question: currentQuestion.question,
                intention: currentQuestion.intention,
                userAnswer: userAnswer,
                jobDescription: report.jobDescription
            })
            setResult(data)
        } catch (err) {
            console.error(err)
            setError("Failed to grade your answer. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleSelectQuestion = (index) => {
        if (window.speechSynthesis) window.speechSynthesis.cancel()
        if (window.activeRecognition) window.activeRecognition.stop()
        setIsSpeaking(false)
        setIsListening(false)

        setSelectedIndex(index)
        setUserAnswer("")
        setResult(null)
        setError("")
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alert("Polished answer copied to clipboard!")
    }

    const getScoreClass = (score) => {
        if (score >= 80) return 'score-badge--high'
        if (score >= 60) return 'score-badge--medium'
        return 'score-badge--low'
    }

    return (
        <div className="practice-session">
            <div className="practice-layout">
                {/* Questions Sidebar */}
                <div className="practice-sidebar">
                    <h3>Practice Questions</h3>
                    <div className="practice-q-list">
                        {questions.map((q, idx) => (
                            <button
                                key={idx}
                                className={`practice-q-item ${selectedIndex === idx ? 'practice-q-item--active' : ''}`}
                                onClick={() => handleSelectQuestion(idx)}
                            >
                                <span className={`q-type-badge q-type-badge--${q.type.toLowerCase()}`}>
                                    {q.type}
                                </span>
                                <p className="q-text">{q.question}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Practice Board */}
                <div className="practice-board">
                    <div className="interviewer-bubble">
                        <div className="interviewer-avatar">🤖</div>
                        <div className="bubble-content">
                            <span className="bubble-tag">Question {selectedIndex + 1} ({currentQuestion.type})</span>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <h4 style={{ flex: 1, margin: 0 }}>{currentQuestion.question}</h4>
                                <button 
                                    type="button"
                                    onClick={speakQuestion}
                                    title={isSpeaking ? "Stop Speaking" : "Listen to Question"}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.1rem 0.25rem', color: '#ff2d78', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 4px rgba(255,45,120,0.2))', transition: 'all 0.15s' }}
                                >
                                    {isSpeaking ? '⏹️' : '🔊'}
                                </button>
                            </div>
                            <p className="intention-text" style={{ marginTop: '0.5rem' }}>💡 <em>Interviewer's intent: {currentQuestion.intention}</em></p>
                        </div>
                    </div>

                    {!result && !loading && (
                        <form onSubmit={handleSubmit} className="answer-form">
                            <div className="input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label htmlFor="user-answer" style={{ margin: 0 }}>Your Response</label>
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`mic-btn ${isListening ? 'mic-btn--recording' : ''}`}
                                        style={{
                                            background: isListening ? '#ff2d78' : 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '2rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            transition: 'all 0.2s',
                                            boxShadow: isListening ? '0 0 12px rgba(255,45,120,0.4)' : 'none'
                                        }}
                                    >
                                        {isListening ? (
                                            <>
                                                <span className="record-dot" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }}></span>
                                                Stop Recording
                                            </>
                                        ) : (
                                            <>
                                                🎤 Answer with Voice
                                            </>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    id="user-answer"
                                    rows="6"
                                    placeholder={isListening ? "Listening to your voice... Speak now!" : "Type your response here. Try to use structural frameworks like STAR (Situation, Task, Action, Result) for behavioral questions."}
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="button primary-button submit-btn">
                                Submit Response for Review
                            </button>
                        </form>
                    )}

                    {loading && (
                        <div className="practice-loading">
                            <div className="spinner"></div>
                            <p>Analyzing your response with AI...</p>
                            <span>Checking logic structure, technical depth, and industry alignment...</span>
                        </div>
                    )}

                    {error && (
                        <div className="practice-error">
                            <p>{error}</p>
                            <button onClick={handleSubmit} className="button secondary-button">Retry</button>
                        </div>
                    )}

                    {result && (
                        <div className="feedback-container">
                            <div className="feedback-header">
                                <h3>Evaluation Result</h3>
                                <div className={`score-badge ${getScoreClass(result.score)}`}>
                                    <span className="score-val">{result.score}</span>
                                    <span className="score-lbl">/100</span>
                                </div>
                            </div>

                            <div className="feedback-section">
                                <h5>📋 Feedback & Analysis</h5>
                                <ul className="feedback-bullets">
                                    {result.feedback.map((item, idx) => (
                                        <li key={idx}>✨ {item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="feedback-section polished-answer-section">
                                <div className="polished-header">
                                    <h5>💡 How to Answer Perfectly</h5>
                                    <button 
                                        onClick={() => copyToClipboard(result.improvedAnswer)}
                                        className="copy-btn"
                                        title="Copy to Clipboard"
                                    >
                                        Copy Text
                                    </button>
                                </div>
                                <div className="polished-content">
                                    <p>{result.improvedAnswer}</p>
                                </div>
                            </div>

                            <div className="feedback-actions">
                                <button 
                                    onClick={() => handleSelectQuestion(selectedIndex)} 
                                    className="button secondary-button"
                                >
                                    Practice Again
                                </button>
                                {selectedIndex < questions.length - 1 && (
                                    <button 
                                        onClick={() => handleSelectQuestion(selectedIndex + 1)} 
                                        className="button primary-button"
                                    >
                                        Next Question
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PracticeSession
