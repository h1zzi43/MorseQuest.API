class Translator {
    constructor() {
        this.input = document.getElementById('translateInput');
        this.mode = document.getElementById('translateMode');
        this.result = document.getElementById('translationResult');
        this.translateBtn = document.getElementById('translateBtn');
        this.audioBtn = document.getElementById('audioBtn');
        this.historyCard = document.getElementById('historyCard');
        this.historyList = document.getElementById('historyList');
        this.init();
    }

    init() {
        this.translateBtn.addEventListener('click', () => this.translate());
        this.audioBtn.addEventListener('click', () => this.playAudio());

        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.translate();
        });

        document.querySelectorAll('.btn-example').forEach(btn => {
            btn.addEventListener('click', () => {
                this.input.value = btn.dataset.text;
                this.mode.value = btn.dataset.mode;
                this.translate();
            });
        });

        this.loadHistory();
    }

    async translate() {
        const text = this.input.value.trim();
        const mode = this.mode.value;

        if (!text) {
            notifications.warning('Enter text to translate');
            return;
        }

        this.result.className = 'translation-output loading';
        this.result.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
        this.translateBtn.disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/morse/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, isMorseToText: mode === 'morseToText' })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();

            if (data.success && data.output) {
                this.result.className = 'translation-output success';
                this.result.textContent = data.output;
                this.addCopyButton();
                this.saveToHistory(text, data.output, mode);
                notifications.success('Translation complete');
            } else {
                throw new Error(data.error || 'Translation failed');
            }
        } catch (error) {
            this.result.className = 'translation-output error';
            this.result.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
            notifications.error('Translation error');
        } finally {
            this.translateBtn.disabled = false;
        }
    }

    async playAudio() {
        const text = this.input.value.trim();
        const mode = this.mode.value;

        if (!text) {
            notifications.warning('Enter text to listen');
            return;
        }

        this.audioBtn.disabled = true;
        const originalHTML = this.audioBtn.innerHTML;
        this.audioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const response = await fetch(`${CONFIG.API_URL}/api/morse/audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, isMorseToText: mode === 'morseToText' })
            });

            if (!response.ok) throw new Error('Audio generation failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);

            audio.onended = () => {
                URL.revokeObjectURL(url);
                notifications.info('Playback finished');
            };

            audio.onerror = () => {
                URL.revokeObjectURL(url);
                throw new Error('Playback error');
            };

            await audio.play();
            notifications.info('Playing...');

        } catch (error) {
            notifications.error('Audio playback failed');
        } finally {
            this.audioBtn.disabled = false;
            this.audioBtn.innerHTML = originalHTML;
        }
    }

    addCopyButton() {
        const existingBtn = this.result.querySelector('.copy-btn');
        if (existingBtn) existingBtn.remove();

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard();
        });

        this.result.appendChild(copyBtn);
    }

    async copyToClipboard() {
        const text = this.result.textContent.replace('Copy', '').trim();

        try {
            await navigator.clipboard.writeText(text);
            const copyBtn = this.result.querySelector('.copy-btn');
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            notifications.success('Copied to clipboard');

            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            }, 2000);
        } catch (error) {
            notifications.error('Copy failed');
        }
    }

    saveToHistory(input, output, mode) {
        try {
            let history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
            history.unshift({ input, output, mode, timestamp: new Date().toISOString() });
            if (history.length > 10) history = history.slice(0, 10);
            localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
            this.loadHistory();
        } catch (error) {
            console.warn('Failed to save history:', error);
        }
    }

    loadHistory() {
        try {
            const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');

            if (history.length === 0) {
                this.historyCard.style.display = 'none';
                return;
            }

            this.historyCard.style.display = 'block';
            this.historyList.innerHTML = history.map((item, index) => `
                <div class="history-item">
                    <div>
                        <div class="history-input">${item.input}</div>
                        <div class="history-output">${item.output}</div>
                    </div>
                    <button class="btn btn-sm btn-outline" onclick="translator.loadFromHistory(${index})">
                        <i class="fas fa-redo"></i>
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.warn('Failed to load history:', error);
        }
    }

    loadFromHistory(index) {
        try {
            const history = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY) || '[]');
            if (history[index]) {
                this.input.value = history[index].input;
                this.mode.value = history[index].mode;
                this.translate();
            }
        } catch (error) {
            notifications.error('Failed to load from history');
        }
    }
}