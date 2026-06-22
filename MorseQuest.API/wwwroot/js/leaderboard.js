class Leaderboard {
    constructor() {
        this.container = document.getElementById('leaderboardContent');
        this.tabs = document.querySelectorAll('[data-mode]');
        this.init();
    }

    init() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.load(tab.dataset.mode);
            });
        });
    }

    async load(mode) {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2em; color: var(--accent-blue);"></i>
                <p style="margin-top: 10px; color: var(--text-secondary);">Loading...</p>
            </div>
        `;

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/api/morse/leaderboard?mode=${mode}&top=${CONFIG.LEADERBOARD.TOP_COUNT}`
            );

            if (!response.ok) throw new Error('Load error');

            const leaders = await response.json();

            if (!leaders || leaders.length === 0) {
                this.container.innerHTML = `
                    <div class="loading-placeholder">
                        <i class="fas fa-trophy" style="font-size: 3em; opacity: 0.3;"></i>
                        <p>No results yet</p>
                        <p style="font-size: 0.9em;">Be the first!</p>
                    </div>
                `;
                return;
            }

            this.container.innerHTML = leaders.map((entry, index) => {
                const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';
                const medal = index === 0 ? '\u{1F947}' : index === 1 ? '\u{1F948}' : index === 2 ? '\u{1F949}' : (index + 1);

                const date = new Date(entry.completedAt);
                const dateStr = date.toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });

                return `
                    <div class="leaderboard-item" style="animation: fadeSlideIn 0.4s ease-out ${index * 0.1}s both;">
                        <div class="leaderboard-rank ${rankClass}">${medal}</div>
                        <div class="leaderboard-info">
                            <div class="leaderboard-name">${this.escapeHtml(entry.username)}</div>
                            <div class="leaderboard-date">${dateStr}</div>
                        </div>
                        <div class="leaderboard-score">${entry.score} pts</div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('Leaderboard error:', error);
            this.container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--accent-red);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2em;"></i>
                    <p style="margin-top: 10px;">Failed to load leaderboard</p>
                    <button class="btn btn-sm btn-outline" onclick="leaderboard.load('${mode}')" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}