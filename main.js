// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // Initialize page-specific functionality
    initTextToSpeech();
    initSpeechToText();
    initTextSummarizer();
    initExpenseTracker();
    initPomodoroTimer();
    initMemoPad();
    initContactForm();
});

// Text to Speech
function initTextToSpeech() {
    const ttsText = document.getElementById('tts-text');
    const ttsVoice = document.getElementById('tts-voice');
    const ttsPitch = document.getElementById('tts-pitch');
    const ttsRate = document.getElementById('tts-rate');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const pitchValue = document.getElementById('pitch-value');
    const rateValue = document.getElementById('rate-value');

    if (!ttsText) return;

    const synth = window.speechSynthesis;
    let utterance = null;

    // Load voices
    function loadVoices() {
        const voices = synth.getVoices();
        if (ttsVoice) {
            ttsVoice.innerHTML = voices
                .map((voice, i) => `<option value="${i}">${voice.name} (${voice.lang})</option>`)
                .join('');
        }
    }

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
    }

    // Update slider values
    if (ttsPitch && pitchValue) {
        ttsPitch.addEventListener('input', (e) => {
            pitchValue.textContent = e.target.value;
        });
    }

    if (ttsRate && rateValue) {
        ttsRate.addEventListener('input', (e) => {
            rateValue.textContent = e.target.value;
        });
    }

    // Play
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const text = ttsText.value;
            if (!text) return;

            if (synth.speaking && synth.paused) {
                synth.resume();
                return;
            }

            utterance = new SpeechSynthesisUtterance(text);
            const voices = synth.getVoices();
            utterance.voice = voices[ttsVoice.value] || voices[0];
            utterance.pitch = ttsPitch.value;
            utterance.rate = ttsRate.value;
            synth.speak(utterance);
        });
    }

    // Pause
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (synth.speaking) synth.pause();
        });
    }

    // Stop
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            synth.cancel();
        });
    }
}

// Speech to Text
function initSpeechToText() {
    const startRecordingBtn = document.getElementById('start-recording');
    const clearTranscriptBtn = document.getElementById('clear-transcript');
    const downloadTranscriptBtn = document.getElementById('download-transcript');
    const transcriptBox = document.getElementById('transcript-box');
    const sttLanguage = document.getElementById('stt-language');
    const micStatus = document.getElementById('mic-icon');
    const statusText = document.getElementById('status-text');

    if (!startRecordingBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        if (transcriptBox) {
            transcriptBox.innerHTML = '<p style="color: #ef4444;">Speech recognition not supported in this browser. Try Chrome or Edge.</p>';
        }
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    let isRecording = false;
    let finalTranscript = '';

    startRecordingBtn.addEventListener('click', () => {
        if (!isRecording) {
            recognition.lang = sttLanguage.value;
            recognition.start();
            isRecording = true;
            startRecordingBtn.textContent = '⏹ Stop Recording';
            startRecordingBtn.classList.add('btn-error');
            if (statusText) statusText.textContent = 'Listening...';
            if (micStatus) micStatus.textContent = '🔴';
        } else {
            recognition.stop();
            isRecording = false;
            startRecordingBtn.textContent = '🎤 Start Recording';
            startRecordingBtn.classList.remove('btn-error');
            if (statusText) statusText.textContent = 'Ready to Listen';
            if (micStatus) micStatus.textContent = '🎤';
        }
    });

    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        if (transcriptBox) {
            transcriptBox.innerHTML = `<p>${finalTranscript}<span style="color: #6b7280;">${interimTranscript}</span></p>`;
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        startRecordingBtn.textContent = '🎤 Start Recording';
        if (statusText) statusText.textContent = 'Error occurred';
    };

    if (clearTranscriptBtn) {
        clearTranscriptBtn.addEventListener('click', () => {
            finalTranscript = '';
            if (transcriptBox) transcriptBox.innerHTML = '<p class="transcript-placeholder">Your transcribed text will appear here...</p>';
        });
    }

    if (downloadTranscriptBtn) {
        downloadTranscriptBtn.addEventListener('click', () => {
            const blob = new Blob([finalTranscript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transcript.txt';
            a.click();
        });
    }
}

// Text Summarizer
function initTextSummarizer() {
    const inputText = document.getElementById('input-text');
    const generateSummaryBtn = document.getElementById('generate-summary');
    const summaryOutput = document.getElementById('summary-output');
    const summaryLength = document.getElementById('summary-length');
    const summaryFormat = document.getElementById('summary-format');
    const copySummaryBtn = document.getElementById('copy-summary');
    const originalWords = document.getElementById('original-words');
    const summaryWords = document.getElementById('summary-words');
    const reduction = document.getElementById('reduction');
    const statsGrid = document.getElementById('stats-grid');

    if (!generateSummaryBtn) return;

    generateSummaryBtn.addEventListener('click', () => {
        const text = inputText.value.trim();
        if (!text) return;

        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const targetRatio = summaryLength.value === 'short' ? 0.25 : summaryLength.value === 'medium' ? 0.5 : 0.75;
        const targetSentences = Math.max(1, Math.round(sentences.length * targetRatio));

        const summary = sentences.slice(0, targetSentences).join(' ');
        const format = summaryFormat.value;

        if (format === 'bullets') {
            const bulletPoints = sentences.slice(0, targetSentences).map(s => `• ${s.trim()}`).join('\n');
            summaryOutput.innerHTML = `<div style="white-space: pre-line;">${bulletPoints}</div>`;
        } else {
            summaryOutput.innerHTML = `<p>${summary}</p>`;
        }

        // Update stats
        const origWords = text.split(/\s+/).length;
        const summWords = summary.split(/\s+/).length;
        const reductionPercent = Math.round((1 - summWords / origWords) * 100);

        if (originalWords) originalWords.textContent = origWords;
        if (summaryWords) summaryWords.textContent = summWords;
        if (reduction) reduction.textContent = reductionPercent + '%';
        if (statsGrid) statsGrid.style.display = 'grid';
    });

    if (copySummaryBtn) {
        copySummaryBtn.addEventListener('click', () => {
            const text = summaryOutput.innerText;
            navigator.clipboard.writeText(text).then(() => {
                copySummaryBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copySummaryBtn.textContent = '📋 Copy';
                }, 2000);
            });
        });
    }
}

// Expense Tracker
function initExpenseTracker() {
    const expenseForm = document.getElementById('expense-form');
    const expensesList = document.getElementById('expenses-list');
    const totalExpenses = document.getElementById('total-expenses');
    const monthExpenses = document.getElementById('month-expenses');
    const transactionCount = document.getElementById('transaction-count');
    const exportBtn = document.getElementById('export-expenses');

    if (!expenseForm) return;

    let expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

    function updateStats() {
        const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthTotal = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
            })
            .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        if (totalExpenses) totalExpenses.textContent = `$${total.toFixed(2)}`;
        if (monthExpenses) monthExpenses.textContent = `$${monthTotal.toFixed(2)}`;
        if (transactionCount) transactionCount.textContent = expenses.length;
    }

    function renderExpenses() {
        if (!expensesList) return;

        if (expenses.length === 0) {
            expensesList.innerHTML = '<p class="empty-state">No expenses recorded yet. Add your first expense above!</p>';
            return;
        }

        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        expensesList.innerHTML = sorted.map((exp, i) => `
            <div class="expense-item" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border);">
                <div>
                    <div style="font-weight: 600;">${exp.description}</div>
                    <div style="font-size: 14px; color: var(--text-secondary);">${exp.category} • ${new Date(exp.date).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="font-weight: 700; color: var(--primary);">$${parseFloat(exp.amount).toFixed(2)}</div>
                    <button onclick="deleteExpense(${i})" style="background: none; border: none; cursor: pointer; font-size: 18px;">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    window.deleteExpense = (index) => {
        expenses.splice(index, 1);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateStats();
        renderExpenses();
    };

    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            amount: document.getElementById('expense-amount').value,
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-description').value,
            date: document.getElementById('expense-date').value
        };
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        expenseForm.reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        updateStats();
        renderExpenses();
    });

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const csv = 'Date,Category,Description,Amount\n' + expenses.map(e => 
                `${e.date},${e.category},${e.description},${e.amount}`
            ).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'expenses.csv';
            a.click();
        });
    }

    // Initialize
    const dateInput = document.getElementById('expense-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    updateStats();
    renderExpenses();
}

// Pomodoro Timer
function initPomodoroTimer() {
    const startWorkBtn = document.getElementById('start-work');
    const startBreakBtn = document.getElementById('start-break');
    const timerValue = document.getElementById('timer-value');
    const sessionBadge = document.getElementById('session-badge');
    const progressBar = document.getElementById('progress-bar');
    const sessionsToday = document.getElementById('sessions-today');
    const focusTime = document.getElementById('focus-time');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings');
    const workDuration = document.getElementById('work-duration');
    const breakDuration = document.getElementById('break-duration');

    if (!startWorkBtn) return;

    let timer = null;
    let timeLeft = 25 * 60;
    let totalTime = 25 * 60;
    let isWorkSession = true;
    let sessions = parseInt(localStorage.getItem('pomodoro-sessions') || '0');
    let totalFocusTime = parseInt(localStorage.getItem('pomodoro-focus-time') || '0');

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        if (timerValue) timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (progressBar) progressBar.style.width = `${((totalTime - timeLeft) / totalTime) * 100}%`;
        if (sessionsToday) sessionsToday.textContent = sessions;
        if (focusTime) focusTime.textContent = `${totalFocusTime}m`;
    }

    function startTimer(duration, isWork) {
        if (timer) clearInterval(timer);
        timeLeft = duration * 60;
        totalTime = duration * 60;
        isWorkSession = isWork;
        if (sessionBadge) sessionBadge.textContent = isWork ? 'Work Session' : 'Break Time';

        timer = setInterval(() => {
            timeLeft--;
            updateDisplay();

            if (timeLeft <= 0) {
                clearInterval(timer);
                if (isWorkSession) {
                    sessions++;
                    totalFocusTime += duration;
                    localStorage.setItem('pomodoro-sessions', sessions);
                    localStorage.setItem('pomodoro-focus-time', totalFocusTime);
                    updateDisplay();
                }
                new Notification('Pomodoro Timer', {
                    body: isWork ? 'Work session complete! Take a break.' : 'Break over! Ready to work?'
                });
            }
        }, 1000);
    }

    if (startWorkBtn) {
        startWorkBtn.addEventListener('click', () => {
            const duration = parseInt(workDuration.value) || 25;
            startTimer(duration, true);
        });
    }

    if (startBreakBtn) {
        startBreakBtn.addEventListener('click', () => {
            const duration = parseInt(breakDuration.value) || 5;
            startTimer(duration, false);
        });
    }

    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (saveSettingsBtn && settingsPanel) {
        saveSettingsBtn.addEventListener('click', () => {
            settingsPanel.style.display = 'none';
        });
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    updateDisplay();
}

// Memo Pad
function initMemoPad() {
    const newMemoBtn = document.getElementById('new-memo');
    const welcomeNewMemoBtn = document.getElementById('welcome-new-memo');
    const memoEditor = document.getElementById('memo-editor');
    const memoWelcome = document.getElementById('memo-welcome');
    const memosList = document.getElementById('memos-list');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const saveMemoBtn = document.getElementById('save-memo');
    const deleteMemoBtn = document.getElementById('delete-memo');
    const memoSearch = document.getElementById('memo-search');
    const memoCount = document.getElementById('memo-count');
    const charCount = document.getElementById('char-count');

    if (!newMemoBtn) return;

    let memos = JSON.parse(localStorage.getItem('memos') || '[]');
    let currentMemoId = null;

    function renderMemosList(filter = '') {
        if (!memosList) return;

        const filtered = memos.filter(m => 
            m.title.toLowerCase().includes(filter.toLowerCase()) || 
            m.content.toLowerCase().includes(filter.toLowerCase())
        );

        if (memoCount) memoCount.textContent = memos.length;

        if (filtered.length === 0) {
            memosList.innerHTML = '<p class="empty-state">No memos found</p>';
            return;
        }

        memosList.innerHTML = filtered.map(memo => `
            <div class="memo-list-item" onclick="loadMemo('${memo.id}')" style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;">
                <div style="font-weight: 600;">${memo.title || 'Untitled'}</div>
                <div style="font-size: 14px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${memo.content.substring(0, 50)}...</div>
            </div>
        `).join('');
    }

    window.loadMemo = (id) => {
        const memo = memos.find(m => m.id === id);
        if (!memo) return;

        currentMemoId = id;
        if (memoTitle) memoTitle.value = memo.title;
        if (memoContent) memoContent.value = memo.content;
        if (memoEditor) memoEditor.style.display = 'block';
        if (memoWelcome) memoWelcome.style.display = 'none';
        updateCharCount();
    };

    function createNewMemo() {
        const id = Date.now().toString();
        const memo = { id, title: '', content: '' };
        memos.unshift(memo);
        currentMemoId = id;
        if (memoTitle) memoTitle.value = '';
        if (memoContent) memoContent.value = '';
        if (memoEditor) memoEditor.style.display = 'block';
        if (memoWelcome) memoWelcome.style.display = 'none';
        renderMemosList();
        memoTitle.focus();
    }

    function saveMemo() {
        if (!currentMemoId) return;
        const memo = memos.find(m => m.id === currentMemoId);
        if (memo) {
            memo.title = memoTitle.value;
            memo.content = memoContent.value;
            localStorage.setItem('memos', JSON.stringify(memos));
            renderMemosList();
        }
    }

    function updateCharCount() {
        if (charCount && memoContent) {
            charCount.textContent = memoContent.value.length;
        }
    }

    if (newMemoBtn) newMemoBtn.addEventListener('click', createNewMemo);
    if (welcomeNewMemoBtn) welcomeNewMemoBtn.addEventListener('click', createNewMemo);
    if (saveMemoBtn) saveMemoBtn.addEventListener('click', saveMemo);
    
    if (deleteMemoBtn) {
        deleteMemoBtn.addEventListener('click', () => {
            if (!currentMemoId) return;
            memos = memos.filter(m => m.id !== currentMemoId);
            localStorage.setItem('memos', JSON.stringify(memos));
            currentMemoId = null;
            if (memoEditor) memoEditor.style.display = 'none';
            if (memoWelcome) memoWelcome.style.display = 'block';
            renderMemosList();
        });
    }

    if (memoContent) {
        memoContent.addEventListener('input', () => {
            updateCharCount();
            saveMemo();
        });
    }

    if (memoTitle) {
        memoTitle.addEventListener('input', saveMemo);
    }

    if (memoSearch) {
        memoSearch.addEventListener('input', (e) => {
            renderMemosList(e.target.value);
        });
    }

    renderMemosList();
}

// Contact Form
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (!contactForm) return;

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulate form submission
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });
}
