const CONFIG = {
    API_URL: window.location.origin,
    STORAGE_KEYS: {
        HISTORY: 'morseHistory',
        USERNAME: 'morseUsername',
        SETTINGS: 'morseSettings'
    },
    TRAINING: {
        QUESTIONS_PER_ROUND: 10,
        DIFFICULTIES: {
            easy: { label: 'Easy', types: ['letters'] },
            medium: { label: 'Medium', types: ['letters', 'numbers'] },
            hard: { label: 'Hard', types: ['words'] }
        }
    },
    QUEST: {
        TASKS_COUNT: 5,
        BASE_POINTS: 10,
        SPEED_BONUS: 50,
        ACCURACY_BONUS: 20
    },
    LEADERBOARD: {
        TOP_COUNT: 10
    }
};

Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.TRAINING);
Object.freeze(CONFIG.QUEST);
Object.freeze(CONFIG.LEADERBOARD);