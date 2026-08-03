import React, { useState, useEffect } from 'react'

const FlashcardsDeck = ({ report }) => {
    const questions = [
        ...report.technicalQuestions.map(q => ({ ...q, type: 'Technical' })),
        ...report.behavioralQuestions.map(q => ({ ...q, type: 'Behavioral' }))
    ]

    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [masteredIndexes, setMasteredIndexes] = useState([])
    const [reviewIndexes, setReviewIndexes] = useState([])

    const currentCard = questions[currentIndex]

    const handleFlip = () => {
        setIsFlipped(!isFlipped)
    }

    const handleNext = () => {
        setIsFlipped(false)
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        setIsFlipped(false)
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    const markMastered = (e) => {
        e.stopPropagation()
        if (!masteredIndexes.includes(currentIndex)) {
            setMasteredIndexes([...masteredIndexes, currentIndex])
            setReviewIndexes(reviewIndexes.filter(i => i !== currentIndex))
        }
        handleNext()
    }

    const markNeedsReview = (e) => {
        e.stopPropagation()
        if (!reviewIndexes.includes(currentIndex)) {
            setReviewIndexes([...reviewIndexes, currentIndex])
            setMasteredIndexes(masteredIndexes.filter(i => i !== currentIndex))
        }
        handleNext()
    }

    const resetDeck = () => {
        setMasteredIndexes([])
        setReviewIndexes([])
        setCurrentIndex(0)
        setIsFlipped(false)
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault()
                setIsFlipped(prev => !prev)
            } else if (e.code === 'ArrowRight') {
                handleNext()
            } else if (e.code === 'ArrowLeft') {
                handlePrev()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, questions.length])

    const isCurrentMastered = masteredIndexes.includes(currentIndex)
    const isCurrentReview = reviewIndexes.includes(currentIndex)

    return (
        <div className="flashcards-section" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem 0' }}>
            
            {/* Header / Stats Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Interactive 3D Flashcards</h2>
                    <p style={{ color: '#8b949e', fontSize: '0.85rem', margin: 0 }}>
                        Flip cards to test your retention. Press <strong>Space</strong> to flip or use arrow keys to navigate.
                    </p>
                </div>

                {/* Progress Badges */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(46,160,67,0.15)', color: '#3fb950', border: '1px solid rgba(46,160,67,0.3)', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✅ Mastered: {masteredIndexes.length}
                    </span>
                    <span style={{ background: 'rgba(210,153,34,0.15)', color: '#d29922', border: '1px solid rgba(210,153,34,0.3)', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        ⚠️ Review: {reviewIndexes.length}
                    </span>
                    <button 
                        onClick={resetDeck} 
                        style={{ background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* 3D Flashcard Deck */}
            <div 
                className="flashcard-stage" 
                style={{ perspective: '1000px', width: '100%', height: '360px', marginBottom: '1.5rem', cursor: 'pointer' }}
                onClick={handleFlip}
            >
                <div 
                    className={`flashcard-3d ${isFlipped ? 'flashcard-3d--flipped' : ''}`}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: '1rem',
                        boxShadow: isFlipped ? '0 12px 32px rgba(255,45,120,0.25)' : '0 8px 24px rgba(0,0,0,0.4)'
                    }}
                >
                    {/* FRONT FACE */}
                    <div 
                        className="flashcard-face flashcard-face--front"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            borderRadius: '1rem',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            background: '#161b22',
                            border: '1px solid #30363d',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                                background: currentCard.type === 'Technical' ? 'rgba(88,166,255,0.15)' : 'rgba(187,128,255,0.15)',
                                color: currentCard.type === 'Technical' ? '#58a6ff' : '#bc8cff',
                                border: `1px solid ${currentCard.type === 'Technical' ? 'rgba(88,166,255,0.3)' : 'rgba(187,128,255,0.3)'}`,
                                padding: '0.25rem 0.65rem',
                                borderRadius: '1rem',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {currentCard.type} Question &bull; Q{currentIndex + 1}
                            </span>
                            {isCurrentMastered && <span style={{ color: '#3fb950', fontSize: '0.85rem', fontWeight: 600 }}>✅ Mastered</span>}
                            {isCurrentReview && <span style={{ color: '#d29922', fontSize: '0.85rem', fontWeight: 600 }}>⚠️ Needs Practice</span>}
                        </div>

                        <div style={{ my: 'auto', textAlign: 'center', padding: '1rem 0' }}>
                            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                                "{currentCard.question}"
                            </h3>
                        </div>

                        <div style={{ textAlign: 'center', color: '#7d8590', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            <span>🔄 Click card or press Space to reveal answer</span>
                        </div>
                    </div>

                    {/* BACK FACE */}
                    <div 
                        className="flashcard-face flashcard-face--back"
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            borderRadius: '1rem',
                            padding: '1.75rem 2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            background: '#1c2128',
                            border: '1px solid #ff2d78',
                            boxSizing: 'border-box',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <span style={{ color: '#ff2d78', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                                    💡 Interviewer Intention
                                </span>
                                <p style={{ color: '#c9d1d9', fontSize: '0.85rem', lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                                    {currentCard.intention}
                                </p>
                            </div>

                            <div>
                                <span style={{ color: '#3fb950', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                                    ✨ Model Response Strategy
                                </span>
                                <p style={{ color: '#f0f6fc', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                                    {currentCard.answer}
                                </p>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', color: '#8b949e', fontSize: '0.75rem', marginTop: '1rem' }}>
                            <span>🔄 Click to flip back</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation & Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    style={{
                        background: '#21262d',
                        border: '1px solid #30363d',
                        color: '#c9d1d9',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentIndex === 0 ? 0.5 : 1
                    }}
                >
                    👈 Previous
                </button>

                {/* Status Marking Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={markNeedsReview}
                        style={{
                            background: 'rgba(210,153,34,0.1)',
                            border: '1px solid rgba(210,153,34,0.4)',
                            color: '#d29922',
                            padding: '0.6rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        ⚠️ Needs Practice
                    </button>
                    <button
                        onClick={markMastered}
                        style={{
                            background: 'rgba(46,160,67,0.15)',
                            border: '1px solid rgba(46,160,67,0.4)',
                            color: '#3fb950',
                            padding: '0.6rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                        }}
                    >
                        ✅ Mark Mastered
                    </button>
                </div>

                <button 
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    style={{
                        background: '#21262d',
                        border: '1px solid #30363d',
                        color: '#c9d1d9',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentIndex === questions.length - 1 ? 0.5 : 1
                    }}
                >
                    Next 👉
                </button>
            </div>

            {/* Pagination Counter */}
            <div style={{ textAlign: 'center', marginTop: '1rem', color: '#8b949e', fontSize: '0.8rem' }}>
                Card {currentIndex + 1} of {questions.length}
            </div>
        </div>
    )
}

export default FlashcardsDeck
