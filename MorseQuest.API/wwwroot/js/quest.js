class Quest {
    constructor() {
        this.state = {
            active: false, tasks: [], currentIndex: 0,
            correct: 0, wrong: 0, startTime: null,
            timerInterval: null, currentTask: null
        };

        this.setupScreen = document.getElementById('questSetup');
        this.gameScreen = document.getElementById('questGame');
        this.resultScreen = document.getElementById('questResult');
        this.startBtn = document.getElementById('startQuestBtn');
        this.submitBtn = document.getElementById('submitQuestBtn');
        this.resetBtn = document.getElementById('resetQuestBtn');
        this.answerInput = document.getElementById('questAnswer');
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.start());
        this.submitBtn.addEventListener('click', () => this.submitAnswer());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });
    }

    async start() {
        try {
            this.startBtn.disabled = true;
            this.startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            const response = await fetch(`${CONFIG.API_URL}/api/morse/quest/tasks?count=${CONFIG.QUEST.TASKS_COUNT}`);
            if (!response.ok) throw new Error('Failed to load tasks');

            const tasks = await response.json();

            this.state = {
                active: true, tasks, currentIndex: 0,
                correct: 0, wrong: 0, startTime: Date.now(),
                timerInterval: null, currentTask: null
            };

            this.setupScreen.style.display = 'none';
            this.gameScreen.style.display = 'block';
            this.resultScreen.style.display = 'none';
            this.startTimer();
            this.loadTask();
            notifications.info('Quest started! Good luck!');

        } catch (error) {
            console.error('Quest start error:', error);
            notifications.error('Failed to load quest');
        } finally {
            this.startBtn.disabled = false;
            this.startBtn.innerHTML = '<i class="fas fa-play"></i> Start Quest';
        }
    }

    startTimer() {
        this.state.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('questTimer').textContent =
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    loadTask() {
        if (!this.state.active || this.state.currentIndex >= this.state.tasks.length) {
            this.end();
            return;
        }

        const task = this.state.tasks[this.state.currentIndex];
        this.state.currentTask = task;

        const progress = (this.state.currentIndex / this.state.tasks.length) * 100;
        document.getElementById('questProgressFill').style.width = `${progress}%`;
        document.getElementById('currentTaskNum').textContent = this.state.currentIndex + 1;
        document.getElementById('questQuestion').textContent = task.morseCode;

        if (task.type === 'choice' && task.options) {
            document.getElementById('questAnswerArea').style.display = 'none';
            const optionsContainer = document.getElementById('questOptions');
            optionsContainer.style.display = 'grid';
            optionsContainer.innerHTML = task.options.map((opt, index) => `
                <div class="option-card" onclick="quest.checkChoice('${opt}')"
                     style="animation: fadeSlideIn 0.3s ease-out ${index * 0.1}s both;">
                    ${opt}
                </div>
            `).join('');
        } else {
            document.getElementById('questAnswerArea').style.display = 'block';
            document.getElementById('questOptions').style.display = 'none';
            this.answerInput.value = '';
            this.answerInput.focus();
        }
    }

    async submitAnswer() {
        if (!this.state.active) return;
        const answer = this.answerInput.value.trim();
        if (!answer) {
            notifications.warning('Enter answer');
            return;
        }
        await this.checkAnswer(answer);
    }

    async checkChoice(choice) {
        if (!this.state.active) return;
        document.querySelectorAll('#questOptions .option-card').forEach(card => {
            card.style.pointerEvents = 'none';
        });
        await this.checkAnswer(choice);
    }

    async checkAnswer(userAnswer) {
        const task = this.state.currentTask;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/morse/quest/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ morseCode: task.morseCode, userAnswer: userAnswer.toUpperCase() })
            });

            if (!response.ok) throw new Error('Check error');

            const result = await response.json();

            if (task.type === 'choice') {
                document.querySelectorAll('#questOptions .option-card').forEach(card => {
                    if (card.textContent.trim() === task.correctAnswer) card.classList.add('correct');
                    if (card.textContent.trim() === userAnswer && !result.isCorrect) card.classList.add('wrong');
                });
            }

            if (result.isCorrect) {
                this.state.correct++;
                notifications.success(`Correct! +${task.points || 10} points`);
            } else {
                this.state.wrong++;
                notifications.error(`Wrong! Answer: ${task.correctAnswer}`);
            }

            this.state.currentIndex++;

            setTimeout(() => {
                if (this.state.currentIndex >= this.state.tasks.length) {
                    this.end();
                } else {
                    this.loadTask();
                }
            }, 1500);

        } catch (error) {
            console.error('Quest check error:', error);
            notifications.error('Answer check failed');
        }
    }

    async end() {
        this.state.active = false;
        clearInterval(this.state.timerInterval);

        const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const accuracy = this.state.tasks.length > 0
            ? Math.round((this.state.correct / this.state.tasks.length) * 100)
            : 0;

        let score = this.state.correct * CONFIG.QUEST.BASE_POINTS;
        if (elapsed < 60) score += CONFIG.QUEST.SPEED_BONUS;
        if (accuracy >= 90) score += CONFIG.QUEST.ACCURACY_BONUS;

        this.gameScreen.style.display = 'none';
        this.resultScreen.style.display = 'block';

        document.getElementById('questScore').textContent = score;
        document.getElementById('questTime').textContent = timeStr;
        document.getElementById('questAccuracy').textContent = `${accuracy}%`;

        try {
            await fetch(`${CONFIG.API_URL}/api/morse/results/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'Quest Player',
                    correctAnswers: this.state.correct,
                    wrongAnswers: this.state.wrong,
                    totalQuestions: this.state.tasks.length,
                    timeSeconds: elapsed,
                    score,
                    mode: 'quest'
                })
            });
        } catch (error) {
            console.warn('Save quest result error:', error);
        }

        notifications.success(`Quest complete! ${score} points`);
    }

    reset() {
        clearInterval(this.state.timerInterval);
        this.state.active = false;
        this.setupScreen.style.display = 'block';
        this.gameScreen.style.display = 'none';
        this.resultScreen.style.display = 'none';
        document.getElementById('questTimer').textContent = '0:00';
        document.getElementById('questProgressFill').style.width = '0%';
        document.getElementById('currentTaskNum').textContent = '1';
    }
}