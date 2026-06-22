class App {
    constructor() {
        this.particlesContainer = document.getElementById('particles');
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.sections = document.querySelectorAll('.section');
        this.init();
    }

    init() {
        this.createParticles();

        this.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const sectionName = tab.dataset.section;
                this.switchSection(sectionName);
            });
        });

        this.setupKeyboardShortcuts();
        this.initModules();
    }

    createParticles() {
        const colors = ['#58a6ff', '#bc8cff', '#d2991d', '#3fb950', '#f85149'];
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 4 + 2;
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 6}s;
                animation-duration: ${Math.random() * 6 + 4}s;
            `;

            fragment.appendChild(particle);
        }

        this.particlesContainer.appendChild(fragment);
    }

    switchSection(sectionName) {
        this.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === sectionName);
        });

        this.sections.forEach(section => {
            section.classList.toggle('active', section.id === `section-${sectionName}`);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                const sectionMap = { '1': 'translator', '2': 'training', '3': 'quest', '4': 'leaderboard' };

                if (sectionMap[e.key]) {
                    e.preventDefault();
                    this.switchSection(sectionMap[e.key]);
                }

                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (translator) translator.translate();
                }
            }

            if (e.key === 'Escape') {
                const input = document.getElementById('translateInput');
                if (input && document.activeElement === input) {
                    input.value = '';
                    document.getElementById('translationResult').innerHTML =
                        '<span class="placeholder-text">Result will appear here...</span>';
                }
            }
        });
    }

    initModules() {
        window.translator = new Translator();
        window.training = new Training();
        window.quest = new Quest();
        window.leaderboard = new Leaderboard();
        window.leaderboard.load('training');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    notifications?.error('An error occurred');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    notifications?.error('Connection error');
});