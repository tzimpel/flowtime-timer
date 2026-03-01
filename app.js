const STORAGE_KEY = 'timerState';

const MODES = {
    IDLE: 'idle',
    WORKING: 'working',
    BREAK: 'break',
};

const DEFAULT_STATE = {
    mode: MODES.IDLE,
    workStartedAt: null,
    breakStartedAt: null,
    breakDurationMs: null,
};

let intervalId = null;
let state = loadState();

const timerDisplay = document.getElementById('timer');
const startStopBtn = document.getElementById('startStopBtn');
const statusDisplay = document.getElementById('status');

function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateBreakTime(workTimeMs) {
    const workMinutes = workTimeMs / 60000;

    if (workMinutes <= 25) {
        return 5 * 60000;
    }

    if (workMinutes <= 50) {
        return 8 * 60000;
    }

    if (workMinutes <= 90) {
        return 10 * 60000;
    }

    return 15 * 60000;
}

function getBreakRemainingMs() {
    if (state.mode !== MODES.BREAK || !state.breakStartedAt || !state.breakDurationMs) {
        return 0;
    }

    return state.breakDurationMs - (Date.now() - state.breakStartedAt);
}

function loadState() {
    try {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) {
            return { ...DEFAULT_STATE };
        }

        const parsedState = JSON.parse(rawState);
        if (!parsedState || typeof parsedState !== 'object') {
            return { ...DEFAULT_STATE };
        }

        const mode = Object.values(MODES).includes(parsedState.mode) ? parsedState.mode : MODES.IDLE;

        return {
            mode,
            workStartedAt: Number.isFinite(parsedState.workStartedAt) ? parsedState.workStartedAt : null,
            breakStartedAt: Number.isFinite(parsedState.breakStartedAt) ? parsedState.breakStartedAt : null,
            breakDurationMs: Number.isFinite(parsedState.breakDurationMs) ? parsedState.breakDurationMs : null,
        };
    } catch (error) {
        return { ...DEFAULT_STATE };
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        // Ignore storage failures so the timer still works without persistence.
    }
}

function clearTicker() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

function startTicker() {
    clearTicker();
    intervalId = window.setInterval(tick, 1000);
}

function resetToIdle(statusMessage = 'Ready to start a new session?') {
    clearTicker();
    state = { ...DEFAULT_STATE };
    saveState();
    render(statusMessage);
}

function startWorkSession() {
    state = {
        mode: MODES.WORKING,
        workStartedAt: Date.now(),
        breakStartedAt: null,
        breakDurationMs: null,
    };
    saveState();
    render();
    startTicker();
}

function startBreakSession() {
    const workTimeMs = Date.now() - state.workStartedAt;

    state = {
        mode: MODES.BREAK,
        workStartedAt: null,
        breakStartedAt: Date.now(),
        breakDurationMs: calculateBreakTime(workTimeMs),
    };
    saveState();
    render();
    startTicker();
}

function tick() {
    if (state.mode === MODES.BREAK && getBreakRemainingMs() <= 0) {
        resetToIdle('Break over! Start a new session?');
        return;
    }

    render();
    saveState();
}

function render(customStatus) {
    if (state.mode === MODES.WORKING && state.workStartedAt) {
        timerDisplay.textContent = formatTime(Date.now() - state.workStartedAt);
        startStopBtn.textContent = 'Stop Work';
        statusDisplay.textContent = customStatus || 'Working...';
        return;
    }

    if (state.mode === MODES.BREAK && state.breakDurationMs) {
        const remainingMs = getBreakRemainingMs();
        timerDisplay.textContent = formatTime(remainingMs);
        startStopBtn.textContent = 'Stop Break';
        statusDisplay.textContent = customStatus || `Break time: ${state.breakDurationMs / 60000} minutes`;
        return;
    }

    timerDisplay.textContent = '00:00';
    startStopBtn.textContent = 'Start Work';
    statusDisplay.textContent = customStatus || 'Ready to start a new session?';
}

function resumeIfNeeded() {
    if (state.mode === MODES.WORKING && state.workStartedAt) {
        render();
        startTicker();
        return;
    }

    if (state.mode === MODES.BREAK && state.breakStartedAt && state.breakDurationMs) {
        if (getBreakRemainingMs() <= 0) {
            resetToIdle('Break over! Start a new session?');
            return;
        }

        render();
        startTicker();
        return;
    }

    resetToIdle();
}

startStopBtn.addEventListener('click', () => {
    if (state.mode === MODES.BREAK) {
        if (!window.confirm('Are you sure you want to stop your break early? It is important to take sufficient breaks!')) {
            return;
        }

        resetToIdle('Break stopped. Ready to start a new session?');
        return;
    }

    if (state.mode === MODES.WORKING) {
        startBreakSession();
        return;
    }

    startWorkSession();
});

resumeIfNeeded();
