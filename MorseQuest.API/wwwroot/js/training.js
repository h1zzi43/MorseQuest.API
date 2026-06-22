class Training {
    constructor() {
        this.state = {
            active: false,
            username: '',
            difficulty: 'easy',
            correct: 0,
            wrong: 0,
            total: 0,
            streak: 0,
            bestStreak: 0,
            currentQuestion: null
        };

        this.setupScreen = document.getElementById('trainingSetup');
        this.gameScreen = document.getElementById('trainingGame');
        this.startBtn = document.getElementById('startTrainingBtn');
        this.usernameInput = document.getElementById('usernameInput');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.start());
        const savedName = localStorage.getItem(CONFIG.STORAGE_KEYS.USERNAME);
        if (savedName) this.usernameInput.value = savedName;
    }

    async start() {
        const username = this.usernameInput.value.trim();
        const difficulty = this.difficultySelect.value;

        if (!username) {
            notifications.warning('Enter your name');
            this.usernameInput.focus();
            return;
        }

        localStorage.setItem(CONFIG.STORAGE_KEYS.USERNAME, username);

        this.state = {
            active: true, username, difficulty,
            correct: 0, wrong: 0, total: 0,
            streak: 0, bestStreak: 0, currentQuestion: null
        };

        this.setupScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        this.updateStats();
        await this.loadQuestion();
        notifications.info('Training started! Good luck!');
    }

    async loadQuestion() {
        if (!this.state.active) return;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/morse/training/question`);
            if (!response.ok) throw new Error(`Load error: ${response.status}`);

            const question = await response.json();
            this.state.currentQuestion = question;

            const morseEl = document.getElementById('morseQuestion');
            morseEl.textContent = question.morseCode;
            morseEl.style.animation = 'none';
            morseEl.offsetHeight;
            morseEl.style.animation = 'morseAppear 0.4s ease-out';

            const container = document.getElementById('optionsContainer');
            container.innerHTML = question.options.map((opt, index) => `
                <div class="option-card" onclick="training.checkAnswer('${opt}')"
                     style="animation: fadeSlideIn 0.4s ease-out ${index * 0.1}s both;">
                    ${opt}
                </div>
            `).join('');

            const progress = (this.state.total / CONFIG.TRAINING.QUESTIONS_PER_ROUND) * 100;
            document.getElementById('trainingProgress').style.width = `${progress}%`;

        } catch (error) {
            console.error('Load question error:', error);
            notifications.error('Failed to load question');
            this.end();
        }
    }

    async checkAnswer(userAnswer) {
        if (!this.state.currentQuestion || !this.state.active) return;

        const question = this.state.currentQuestion;
        this.state.total++;

        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => card.classList.add('answered'));

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/morse/training/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ morseCode: question.morseCode, userAnswer: userAnswer })
            });

            if (!response.ok) throw new Error('Check error');

            const result = await response.json();

            cards.forEach(card => {
                if (card.textContent.trim() === question.correctAnswer) {
                    card.classList.add('correct');
                }
                if (card.textContent.trim() === userAnswer && !result.isCorrect) {
                    card.classList.add('wrong');
                }
            });

            if (result.isCorrect) {
                this.state.correct++;
                this.state.streak++;
                if (this.state.streak > this.state.bestStreak) {
                    this.state.bestStreak = this.state.streak;
                }
                if (this.state.streak >= 5) {
                    notifications.success(`Streak ${this.state.streak}! Great!`);
                } else {
                    notifications.success('Correct!');
                }
            } else {
                this.state.wrong++;
                this.state.streak = 0;
                notifications.error(`Wrong! Answer: ${question.correctAnswer}`);
            }

            this.updateStats();

            setTimeout(() => {
                if (this.state.total >= CONFIG.TRAINING.QUESTIONS_PER_ROUND) {
                    this.end();
                } else {
                    this.loadQuestion();
                }
            }, 1500);

        } catch (error) {
            console.error('Check answer error:', error);
            notifications.error('Answer check failed');
        }
    }

    updateStats() {
        document.getElementById('correctAnswers').textContent = this.state.correct;
        document.getElementById('wrongAnswers').textContent = this.state.wrong;
        document.getElementById('totalQuestions').textContent = this.state.total;
        document.getElementById('currentStreak').textContent = this.state.streak;

        ['correctAnswers', 'wrongAnswers', 'totalQuestions', 'currentStreak'].forEach(id => {
            const el = document.getElementById(id);
            el.style.transform = 'scale(1.3)';
            el.style.transition = 'transform 0.15s ease';
            setTimeout(() => el.style.transform = 'scale(1)', 200);
        });
    }

    async end() {
        this.state.active = false;

        try {
            await fetch(`${CONFIG.API_URL}/api/morse/results/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: this.state.username,
                    correctAnswers: this.state.correct,
                    wrongAnswers: this.state.wrong,
                    totalQuestions: this.state.total,
                    timeSeconds: 0,
                    score: this.state.correct * 10,
                    mode: 'training'
                })
            });
        } catch (error) {
            console.warn('Save result error:', error);
        }

        const accuracy = this.state.total > 0
            ? Math.round((this.state.correct / this.state.total) * 100)
            : 0;

        const emoji = accuracy >= 90 ? '\u{1F3C6}' : accuracy >= 70 ? '\u{1F31F}' : accuracy >= 50 ? '\u{1F44D}' : '\u{1F4AA}';

        this.gameScreen.innerHTML = `
            <div style="text-align: center; padding: 40px 0;">
                <div style="font-size: 5em; margin-bottom: 20px; animation: bounce 0.8s ease infinite;">${emoji}</div>
                <h2 style="color: var(--accent-green); margin-bottom: 30px;">Training Complete!</h2>
                <div class="stats-grid">
                    <div class="stat-card highlight">
                        <div class="stat-icon">Accuracy</div>
                        <div class="stat-value text-green">${accuracy}%</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">Correct</div>
                        <div class="stat-value text-green">${this.state.correct}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">Best Streak</div>
                        <div class="stat-value text-yellow">${this.state.bestStreak}</div>
                    </div>
                </div>
                <button class="btn btn-primary btn-lg" onclick="training.reset()" style="margin-top: 30px;">
                    <i class="fas fa-redo"></i> Play Again
                </button>
            </div>
        `;

        notifications.success(`Training complete! Accuracy: ${accuracy}%`);
    }

    reset() {
        this.gameScreen.innerHTML = `
            <div class="progress-bar"><div class="progress-fill" id="trainingProgress" style="width: 0%"></div></div>
            <div class="morse-display" id="morseQuestion"></div>
            <div class="options-grid" id="optionsContainer"></div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon">Correct</div><div class="stat-value text-green" id="correctAnswers">0</div></div>
                <div class="stat-card"><div class="stat-icon">Wrong</div><div class="stat-value text-red" id="wrongAnswers">0</div></div>
                <div class="stat-card"><div class="stat-icon">Total</div><div class="stat-value text-blue" id="totalQuestions">0</div></div>
                <div class="stat-card"><div class="stat-icon">Streak</div><div class="stat-value text-yellow" id="currentStreak">0</div></div>
            </div>
        `;
        this.gameScreen.style.display = 'none';
        this.setupScreen.style.display = 'block';
    }
}