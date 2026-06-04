// State Management
const state = {
    players: [],
    ronde: 1,
    putaran: 0,
    targetScore: 1000,
    history: [],
    archives: [],
    stats: {},
    snapshots: [], // For Undo
    isProcessing: false
};

// DOM Elements
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    appContainer: document.getElementById('app-container'),
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    playersContainer: document.getElementById('players-container'),
    rankingList: document.getElementById('ranking-list'),
    historyList: document.getElementById('history-list'),
    statsContent: document.getElementById('stats-content'),
    archiveList: document.getElementById('archive-list'),
    rondeDisplay: document.getElementById('ronde-display'),
    putaranDisplay: document.getElementById('putaran-display'),
    targetDisplay: document.getElementById('target-display'),
    modalBurnConfirm: document.getElementById('modal-burn-confirm'),
    modalResetConfirm: document.getElementById('modal-reset-confirm'),
    burnVictimName: document.getElementById('burn-victim-name'),
    burnPerpetratorList: document.getElementById('burn-perpetrator-list'),
    fireOverlay: document.getElementById('fire-overlay'),
    starOverlay: document.getElementById('star-overlay')
};

// Audio Context
let audioCtx;
const sounds = {
    godofgambler: new Audio('godofgambler.wav'),
    dimulaidari0: new Audio('dimulaidari0.wav')
};

// Initialize
window.addEventListener('load', () => {
    setTimeout(() => {
        elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            elements.loadingScreen.classList.add('hidden');
            elements.appContainer.classList.remove('hidden');
            loadData();
            initGame();
        }, 500);
    }, 1500);
});

function initGame() {
    setupEventListeners();
    renderSetupInputs();
    updateUI();
}

function setupEventListeners() {
    // Setup Screen
    document.getElementById('btn-start-game').addEventListener('click', startGame);

    // Game Actions
    document.getElementById('btn-save-turn').addEventListener('click', saveTurn);
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-reset-game').addEventListener('click', () => showModal('modal-reset-confirm'));
    document.getElementById('btn-confirm-reset').addEventListener('click', resetGame);
    document.getElementById('btn-cancel-reset').addEventListener('click', hideModals);
    document.getElementById('btn-cancel-burn').addEventListener('click', hideModals);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Utilities
    document.getElementById('btn-screenshot').addEventListener('click', takeScreenshot);
    document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
}

function renderSetupInputs() {
    const inputs = ['p1-name', 'p2-name', 'p3-name', 'p4-name'];
    inputs.forEach((id, index) => {
        const el = document.getElementById(id);
        if (state.players[index]) {
            el.value = state.players[index].name;
        }
    });
    document.getElementById('target-score').value = state.targetScore;
}

function startGame() {
    const names = [
        document.getElementById('p1-name').value || 'Pemain A',
        document.getElementById('p2-name').value || 'Pemain B',
        document.getElementById('p3-name').value || 'Pemain C',
        document.getElementById('p4-name').value || 'Pemain D'
    ];
    
    state.targetScore = parseInt(document.getElementById('target-score').value);
    
    // Initialize players if new game, or update names if continuing
    if (state.players.length === 0) {
        state.players = names.map((name, i) => ({
            id: i,
            name: name,
            score: 0,
            stars: 0,
            burned: false
        }));
    } else {
        state.players.forEach((p, i) => {
            p.name = names[i];
        });
    }

    state.ronde = 1;
    state.putaran = 0;
    state.history = [];
    
    saveData();
    showScreen('game');
    updateUI();
    speak("Permainan dimulai");
}

function showScreen(screenName) {
    elements.setupScreen.classList.add('hidden');
    elements.gameScreen.classList.add('hidden');
    
    if (screenName === 'setup') {
        elements.setupScreen.classList.remove('hidden');
    } else {
        elements.gameScreen.classList.remove('hidden');
    }
}

function updateUI() {
    elements.rondeDisplay.textContent = `RONDE ${state.ronde}`;
    elements.putaranDisplay.textContent = `PUTERAN ${state.putaran}`;
    elements.targetDisplay.textContent = `TARGET: ${state.targetScore}`;

    renderPlayerCards();
    renderRanking();
    renderHistory();
    renderStats();
    renderArchive();
    
    // Update input labels
    state.players.forEach((p, i) => {
        document.getElementById(`label-p${i+1}`).textContent = p.name;
    });
}

function renderPlayerCards() {
    elements.playersContainer.innerHTML = '';
    
    state.players.forEach(player => {
        const card = document.createElement('div');
        card.className = `player-card ${player.score < 0 ? 'negative' : ''}`;
        
        const isCandidate = isBurnCandidate(player);
        const canBurnBtn = player.score > 0 && isCandidate;
        
        let starsHtml = '';
        for(let i=0; i<player.stars; i++) starsHtml += '⭐';

        card.innerHTML = `
            <div class="player-name">
                ${player.name}
                <button class="edit-name-btn" onclick="editName(${player.id})">✏️</button>
            </div>
            <div class="player-stars">${starsHtml}</div>
            <div class="player-score">${player.score}</div>
            ${player.score < 0 ? '<div class="minus-icon">👎</div>' : ''}
            <button class="burn-btn ${canBurnBtn ? 'unlocked' : ''}" 
                    onclick="initiateBurn(${player.id})" 
                    ${!canBurnBtn ? 'disabled' : ''}>
                🔥 TERBAKAR
            </button>
        `;
        elements.playersContainer.appendChild(card);
    });
}

function isBurnCandidate(player) {
    if (player.score <= 0) return false;
    
    // Check if anyone was below them and now is above or equal
    // Logic: If I am candidate, it means someone overtook me.
    // Actually, prompt says: "If player previously below successfully passes higher player, then higher becomes candidate."
    // So we need to check history of positions.
    // Simplified: We store "previousRank" or check against snapshot.
    // Better approach: Check current rankings vs previous round's final rankings?
    // Prompt: "Aplikasi harus menyimpan riwayat posisi pemain."
    
    // Let's use a simpler logic based on the prompt's example:
    // A=180, B=180 (B came from below). B passes A -> A is candidate.
    // We need to track who is "chasing".
    
    // For this implementation, we'll mark candidates during saveTurn logic
    // and store it in player object temporarily or calculate dynamically.
    // To keep it robust, we'll add a 'isCandidate' property to player state during calculation.
    
    return player.isCandidate || false;
}

function saveTurn() {
    if (state.isProcessing) return;
    
    const scores = [
        parseInt(document.getElementById('input-p1').value) || 0,
        parseInt(document.getElementById('input-p2').value) || 0,
        parseInt(document.getElementById('input-p3').value) || 0,
        parseInt(document.getElementById('input-p4').value) || 0
    ];

    // Validate max input
    if (scores.some(s => s > 1000)) {
        alert("Nilai maksimal per puteran adalah 1000");
        return;
    }

    // Save Snapshot for Undo
    saveSnapshot();

    state.putaran++;
    
    // Update Scores
    let roundWinner = null;
    
    // Calculate new scores and check winners
    state.players.forEach((p, i) => {
        p.score += scores[i];
        
        // Check Win
        if (p.score >= state.targetScore && p.stars === 0) {
            p.stars++;
            roundWinner = p;
        }
    });

    // Determine Burn Candidates
    determineBurnCandidates();

    // Add to History
    const historyEntry = {
        type: 'turn',
        ronde: state.ronde,
        putaran: state.putaran,
        scores: scores,
        totals: state.players.map(p => p.score)
    };
    state.history.unshift(historyEntry);

    // Clear Inputs
    document.querySelectorAll('.score-inputs input').forEach(input => input.value = '');

    saveData();
    updateUI();

    // TTS Sequence
    if (roundWinner) {
        handleWin(roundWinner);
    } else {
        // Normal Turn TTS
        const lowestPlayer = getLowestPlayer();
        const queue = [
            `Silakan ${lowestPlayer.name} kocok kartunya`,
            ...state.players.map(p => `${p.name} total poin ${numberToBahasaIndonesia(p.score)}`)
        ];
        speakQueue(queue);
    }
}

function determineBurnCandidates() {
    // Reset candidates
    state.players.forEach(p => p.isCandidate = false);

    // Sort by score desc
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    
    // Check overtakes
    // We need previous state to compare. Since we don't store full history of ranks easily,
    // we can assume: If a player with lower score in previous turn (stored in snapshot?) passed someone.
    // Simpler: Compare current rank with rank before this turn.
    
    const prevSnapshot = state.snapshots[state.snapshots.length - 1];
    if (!prevSnapshot) return;

    const prevPlayers = prevSnapshot.players;

    // For each pair
    for (let i = 0; i < state.players.length; i++) {
        for (let j = i + 1; j < state.players.length; j++) {
            const currentHigher = state.players[i]; // Currently higher score
            const currentLower = state.players[j];  // Currently lower score
            
            // Find their previous scores
            const prevHigher = prevPlayers.find(p => p.id === currentHigher.id);
            const prevLower = prevPlayers.find(p => p.id === currentLower.id);

            if (prevHigher && prevLower) {
                // If previously Lower was actually higher or equal, and now is lower? No.
                // Condition: "Player previously below successfully passes player higher"
                // Means: Prev: Lower < Higher. Now: Lower > Higher.
                // Then Higher becomes candidate.
                
                if (prevLower.score < prevHigher.score && currentLower.score > currentHigher.score) {
                    currentHigher.isCandidate = true;
                }
                
                // Condition: "If player previously below successfully equals score"
                // "B still considered coming from below... status doesn't disappear"
                // This implies if they are equal, and B came from below, B is still "chasing".
                // But burn happens when passing.
                
                // What if they become equal?
                if (prevLower.score < prevHigher.score && currentLower.score === currentHigher.score) {
                    // They are tied. The one who was higher is now "caught".
                    // Prompt says: "If A=180, B=180 (B came from below)... B still considered coming from below."
                    // It doesn't say A is burnable yet. Only when passed.
                }
            }
        }
    }
}

function handleWin(player) {
    state.isProcessing = true;
    
    // TTS & Audio & Animation
    speakQueue([
        `Selamat kepada ${player.name} mendapatkan bintang satu`
    ], () => {
        playSound('godofgambler');
        showStarAnimation();
        
        setTimeout(() => {
            speakQueue(["Silakan bandar kocok kartunya"], () => {
                endRonde();
            });
        }, 2000);
    });
}

function endRonde() {
    state.isProcessing = false;
    // Auto finish ronde? Prompt says "Ronde otomatis selesai".
    // Then show setup for new ronde.
    
    setTimeout(() => {
        alert(`Ronde ${state.ronde} Selesai! Pemenang: ${state.players.find(p=>p.stars>0)?.name || '???'}`);
        state.ronde++;
        state.putaran = 0;
        // Reset scores for new ronde? Usually yes in card games like Cekih.
        // Prompt doesn't explicitly say reset scores, but "Ronde Baru" implies fresh game.
        // However, "Statistik pemain harus disimpan berdasarkan nama... Jika Yoga bermain lagi pada ronde berikutnya: Statistik Yoga harus tetap digunakan."
        // This refers to global stats (burns, etc), not round score.
        // Standard Cekih: Scores reset per round.
        state.players.forEach(p => {
            p.score = 0;
            p.isCandidate = false;
        });
        
        saveData();
        showScreen('setup');
        renderSetupInputs();
    }, 1000);
}

function initiateBurn(victimId) {
    const victim = state.players.find(p => p.id === victimId);
    if (!victim) return;

    elements.burnVictimName.textContent = victim.name;
    elements.burnPerpetratorList.innerHTML = '';

    state.players.forEach(p => {
        if (p.id !== victimId) {
            const btn = document.createElement('button');
            btn.className = 'modal-option-btn';
            btn.textContent = p.name;
            btn.onclick = () => executeBurn(p, victim);
            elements.burnPerpetratorList.appendChild(btn);
        }
    });

    showModal('modal-burn-confirm');
}

function executeBurn(perpetrator, victim) {
    hideModals();
    saveSnapshot();

    // Update Stats
    updatePlayerStat(perpetrator.name, 'burns', 1);
    updatePlayerStat(victim.name, 'burned', 1);

    // Check Triple Burn
    const currentTurnHistory = state.history[0];
    if (currentTurnHistory && currentTurnHistory.type === 'turn') {
        // Count burns in this turn? 
        // We need to track burns per turn separately in state.
        // Let's add a temporary counter in state for current turn burns.
        state.currentTurnBurns = (state.currentTurnBurns || 0) + 1;
        
        if (state.currentTurnBurns === 3) {
            updatePlayerStat(perpetrator.name, 'tripleBurn', 1);
            state.history.unshift({ type: 'triple', perpetrator: perpetrator.name });
            speakQueue(["Triple Burn"]);
        }
    }

    // Add to History
    state.history.unshift({
        type: 'burn',
        perpetrator: perpetrator.name,
        victim: victim.name,
        ronde: state.ronde,
        putaran: state.putaran
    });

    // Animation & Audio Sequence
    showFireAnimation(() => {
        // After animation
        victim.score = 0;
        victim.isCandidate = false;
        
        speakQueue([`${perpetrator.name} membakar ${victim.name}`], () => {
            playSound('dimulaidari0');
            saveData();
            updateUI();
        });
    });
}

function showFireAnimation(callback) {
    elements.fireOverlay.classList.remove('hidden');
    setTimeout(() => {
        elements.fireOverlay.classList.add('hidden');
        if (callback) callback();
    }, 2000);
}

function showStarAnimation() {
    elements.starOverlay.classList.remove('hidden');
    setTimeout(() => {
        elements.starOverlay.classList.add('hidden');
    }, 2000);
}

function getLowestPlayer() {
    // Sort ascending
    const sorted = [...state.players].sort((a, b) => a.score - b.score);
    return sorted[0];
}

function undo() {
    if (state.snapshots.length === 0) {
        alert("Tidak ada aksi untuk di-undo");
        return;
    }
    
    const lastState = state.snapshots.pop();
    // Restore deep copy
    state.players = JSON.parse(lastState.players);
    state.ronde = lastState.ronde;
    state.putaran = lastState.putaran;
    state.history = JSON.parse(lastState.history);
    state.currentTurnBurns = lastState.currentTurnBurns;
    
    saveData();
    updateUI();
    speak("Undo berhasil");
}

function saveSnapshot() {
    const snapshot = {
        players: JSON.stringify(state.players),
        ronde: state.ronde,
        putaran: state.putaran,
        history: JSON.stringify(state.history),
        currentTurnBurns: state.currentTurnBurns || 0
    };
    state.snapshots.push(snapshot);
    // Limit snapshots
    if (state.snapshots.length > 10) state.snapshots.shift();
}

function resetGame() {
    hideModals();
    state.ronde = 1;
    state.putaran = 0;
    state.history = [];
    state.players.forEach(p => {
        p.score = 0;
        p.stars = 0;
        p.isCandidate = false;
    });
    state.snapshots = [];
    state.currentTurnBurns = 0;
    
    saveData();
    updateUI();
    showScreen('setup');
    speak("Permainan direset");
}

// Stats & Archive
function updatePlayerStat(name, key, amount) {
    if (!state.stats[name]) {
        state.stats[name] = { stars: 0, burns: 0, burned: 0, tripleBurn: 0, highestScore: 0 };
    }
    state.stats[name][key] += amount;
    
    // Update Highest Score
    const player = state.players.find(p => p.name === name);
    if (player && player.score > state.stats[name].highestScore) {
        state.stats[name].highestScore = player.score;
    }
    
    // Add to Archive if not exists
    if (!state.archives.includes(name)) {
        state.archives.push(name);
    }
}

function renderStats() {
    elements.statsContent.innerHTML = '';
    Object.keys(state.stats).forEach(name => {
        const s = state.stats[name];
        const div = document.createElement('div');
        div.className = 'card';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <h4>${name}</h4>
            <p>⭐ Stars: ${s.stars}</p>
            <p>🔥 Burns: ${s.burns}</p>
            <p>💀 Burned: ${s.burned}</p>
            <p>💣 Triple Burn: ${s.tripleBurn}</p>
            <p>🏆 High Score: ${s.highestScore}</p>
        `;
        elements.statsContent.appendChild(div);
    });
}

function renderArchive() {
    elements.archiveList.innerHTML = '';
    state.archives.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        elements.archiveList.appendChild(li);
    });
}

function renderRanking() {
    elements.rankingList.innerHTML = '';
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    sorted.forEach((p, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>#${index + 1} ${p.name}</span> <span>${p.score}</span>`;
        elements.rankingList.appendChild(li);
    });
}

function renderHistory() {
    elements.historyList.innerHTML = '';
    state.history.forEach(h => {
        const li = document.createElement('li');
        if (h.type === 'burn') {
            li.className = 'history-item burn';
            li.textContent = `🔥 ${h.perpetrator} membakar ${h.victim}`;
        } else if (h.type === 'triple') {
            li.className = 'history-item triple';
            li.textContent = `💣 TRIPLE BURN - ${h.perpetrator}`;
        } else {
            li.className = 'history-item';
            li.textContent = `R${h.ronde} P${h.putaran}: ${h.totals.join(', ')}`;
        }
        elements.historyList.appendChild(li);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Utilities
function editName(id) {
    const player = state.players.find(p => p.id === id);
    const newName = prompt("Edit Nama:", player.name);
    if (newName && newName.trim() !== "") {
        // If name changes, stats are reset for new name as per prompt
        player.name = newName.trim();
        saveData();
        updateUI();
    }
}

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function takeScreenshot() {
    alert("Fitur Screenshot: Gunakan tombol Power + Volume Down pada Android Anda untuk mengambil tangkapan layar terbaik.");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// TTS & Audio
function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
    }
}

function speakQueue(texts, callback) {
    if (!texts || texts.length === 0) {
        if (callback) callback();
        return;
    }
    
    const text = texts.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    
    utterance.onend = () => {
        speakQueue(texts, callback);
    };
    
    window.speechSynthesis.speak(utterance);
}

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed", e));
    }
}

function numberToBahasaIndonesia(num) {
    if (num === 0) return "nol";
    if (num < 0) return "minus " + numberToBahasaIndonesia(Math.abs(num));
    
    const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
    
    if (num < 12) return satuan[num];
    if (num < 20) return satuan[num - 10] + " belas";
    if (num < 100) return satuan[Math.floor(num / 10)] + " puluh " + satuan[num % 10];
    if (num < 200) return "seratus " + numberToBahasaIndonesia(num - 100);
    if (num < 1000) return satuan[Math.floor(num / 100)] + " ratus " + numberToBahasaIndonesia(num % 100);
    if (num < 2000) return "seribu " + numberToBahasaIndonesia(num - 1000);
    return num.toString(); // Fallback for large numbers
}

// LocalStorage
function saveData() {
    localStorage.setItem('scoreCekihData', JSON.stringify({
        players: state.players,
        ronde: state.ronde,
        putaran: state.putaran,
        targetScore: state.targetScore,
        history: state.history,
        stats: state.stats,
        archives: state.archives
    }));
}

function loadData() {
    const data = localStorage.getItem('scoreCekihData');
    if (data) {
        const parsed = JSON.parse(data);
        state.players = parsed.players || [];
        state.ronde = parsed.ronde || 1;
        state.putaran = parsed.putaran || 0;
        state.targetScore = parsed.targetScore || 1000;
        state.history = parsed.history || [];
        state.stats = parsed.stats || {};
        state.archives = parsed.archives || [];
    }
}
