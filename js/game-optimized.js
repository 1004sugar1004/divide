// ==================== 상수 정의 ====================
const CONSTANTS = {
    PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    DICE_EMOJIS: ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'],
    RPS_CHOICES: ['rock', 'paper', 'scissors'],
    RPS_EMOJI: { rock: '✊', paper: '✋', scissors: '✌️' },
    RPS_TEXT: { rock: '바위', paper: '보', scissors: '가위' },
    SPECIAL_MOVE: -2,
    STARTING_POSITION: 1,
    CHOICE_COUNT: 6,
    DICE_ANIMATION_COUNT: 10,
    DICE_ANIMATION_INTERVAL: 100
};

// 보드 셀 정의
const BOARD_DEFINITIONS = [
    { type: 'start', text: '시작' },
    { type: 'division', template: '5_÷3', blank: 'dividend1' },
    { type: 'division', template: '7_÷5', blank: 'dividend1' },
    { type: 'division', template: '3_÷2', blank: 'dividend1' },
    { type: 'division', template: '3_4÷8', blank: 'dividendMiddle' },
    { type: 'division', template: '3_÷5', blank: 'dividend1' },
    { type: 'division', template: '1_2÷4', blank: 'dividendMiddle' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '5_÷6', blank: 'dividend1' },
    { type: 'division', template: '_23÷7', blank: 'dividend0' },
    { type: 'division', template: '_1÷3', blank: 'dividend0' },
    { type: 'division', template: '1_÷4', blank: 'dividend1' },
    { type: 'division', template: '25_÷4', blank: 'dividend2' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '13_÷9', blank: 'dividend2' },
    { type: 'division', template: '34_÷3', blank: 'dividend2' },
    { type: 'division', template: '6_4÷4', blank: 'dividendMiddle' },
    { type: 'division', template: '81_÷4', blank: 'dividend2' },
    { type: 'division', template: '45_÷5', blank: 'dividend2' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '_4÷4', blank: 'dividend0' },
    { type: 'division', template: '8_÷2', blank: 'dividend1' },
    { type: 'division', template: '20_÷3', blank: 'dividend2' },
    { type: 'division', template: '92_÷4', blank: 'dividend2' },
    { type: 'end', text: '도착!' }
];

const BOARD_SETTINGS = {
    width: 900,
    height: 600,
    cellSize: 70
};

const BOARD_POSITIONS = [
    { x: 105, y: 525 },  // 0 시작
    { x: 185, y: 505 },  // 1
    { x: 265, y: 490 },  // 2
    { x: 345, y: 475 },  // 3
    { x: 425, y: 465 },  // 4
    { x: 505, y: 455 },  // 5
    { x: 585, y: 450 },  // 6
    { x: 665, y: 445 },  // 7
    { x: 725, y: 420 },  // 8
    { x: 690, y: 375 },  // 9
    { x: 640, y: 340 },  // 10
    { x: 580, y: 305 },  // 11
    { x: 500, y: 275 },  // 12
    { x: 430, y: 255 },  // 13
    { x: 355, y: 235 },  // 14
    { x: 285, y: 215 },  // 15
    { x: 235, y: 195 },  // 16
    { x: 180, y: 170 },  // 17
    { x: 140, y: 135 },  // 18
    { x: 200, y: 110 },  // 19
    { x: 340, y: 95 },   // 20
    { x: 410, y: 80 },   // 21
    { x: 485, y: 85 },   // 22
    { x: 565, y: 105 },  // 23
    { x: 645, y: 135 },  // 24
    { x: 725, y: 165 },  // 25
    { x: 810, y: 195 }   // 26 도착
];

// ==================== 게임 상태 ====================
const gameState = {
    numPlayers: 0,
    players: [],
    currentPlayerIndex: 0,
    boardCells: [],
    diceValue: 0,
    gamePhase: 'playerSelection'
};

// ==================== 사운드 시스템 ====================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

// 사운드 유틸리티
const Sound = {
    play(type, ...args) {
        if (!soundEnabled) return;
        
        const sounds = {
            dice: () => this.createSound(200, 'square', 0.3, 0.1),
            correct: () => this.playMelody([523.25, 659.25, 783.99], 0.1),
            wrong: () => this.createSweep(400, 200, 'sawtooth', 0.2, 0.3),
            move: (steps) => {
                const freq = steps > 0 ? 600 : 300;
                for (let i = 0; i < Math.abs(steps); i++) {
                    setTimeout(() => this.createSound(freq, 'square', 0.15, 0.1), i * 150);
                }
            },
            win: () => this.playMelody([523.25, 659.25, 783.99, 1046.5], 0.15, [0, 0.15, 0.3, 0.45]),
            click: () => this.createSound(800, 'sine', 0.1, 0.05)
        };
        
        sounds[type]?.(...args);
    },
    
    createSound(freq, type, gain, duration) {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = type;
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration);
    },
    
    createSweep(startFreq, endFreq, type, gain, duration) {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(startFreq, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + duration);
        osc.type = type;
        
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration);
    },
    
    playMelody(notes, duration = 0.2, times = null) {
        notes.forEach((freq, index) => {
            const startTime = audioContext.currentTime + (times ? times[index] : index * 0.1);
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    }
};

// ==================== UI 유틸리티 ====================
const UI = {
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },
    
    hide(...elements) {
        elements.forEach(el => {
            const elem = typeof el === 'string' ? document.getElementById(el) : el;
            elem?.classList.add('hidden');
        });
    },
    
    show(...elements) {
        elements.forEach(el => {
            const elem = typeof el === 'string' ? document.getElementById(el) : el;
            elem?.classList.remove('hidden');
        });
    },
    
    setHTML(elementId, html) {
        const elem = document.getElementById(elementId);
        if (elem) elem.innerHTML = html;
    },
    
    setText(elementId, text) {
        const elem = document.getElementById(elementId);
        if (elem) elem.textContent = text;
    }
};

// ==================== 나눗셈 계산 ====================
const Division = {
    calculate(template, diceValue = null) {
        if (!template.includes('_')) {
            return this.calculateFixed(template);
        }
        return this.calculateWithBlank(template, diceValue);
    },
    
    calculateFixed(template) {
        const match = template.match(/(\d+)÷(\d+)/);
        if (!match) return null;
        
        return this.getResult(parseInt(match[1]), parseInt(match[2]));
    },
    
    calculateWithBlank(template, diceValue) {
        if (diceValue == null) return null;
        
        let match;
        
        // Blank in the hundreds/tens place of the dividend: _4÷8
        match = template.match(/_(\d+)÷(\d+)/);
        if (match) {
            const dividend = parseInt(`${diceValue}${match[1]}`, 10);
            const divisor = parseInt(match[2], 10);
            return this.getResult(dividend, divisor);
        }
        
        // Blank inside the dividend (e.g., 3_4÷8)
        match = template.match(/(\d+)_([0-9]+)÷(\d+)/);
            if (match) {
            const dividend = parseInt(`${match[1]}${diceValue}${match[2]}`, 10);
            const divisor = parseInt(match[3], 10);
            return this.getResult(dividend, divisor);
        }
        
        // Blank in the ones place of the dividend: 45_÷5, 5_÷3, etc.
        match = template.match(/(\d+)_÷(\d+)/);
        if (match) {
            const dividend = parseInt(`${match[1]}${diceValue}`, 10);
            const divisor = parseInt(match[2], 10);
            return this.getResult(dividend, divisor);
        }
        
        // Blank in the tens place of the divisor: 8÷_4
        match = template.match(/(\d+)÷_(\d+)/);
        if (match) {
            const dividend = parseInt(match[1], 10);
            const divisor = parseInt(`${diceValue}${match[2]}`, 10);
                return this.getResult(dividend, divisor);
            }
        
        // Blank in the ones place of the divisor: 6÷4_
        match = template.match(/(\d+)÷(\d+)_/);
        if (match) {
            const dividend = parseInt(match[1], 10);
            const divisor = parseInt(`${match[2]}${diceValue}`, 10);
            return this.getResult(dividend, divisor);
        }
        
        return null;
    },
    
    getResult(dividend, divisor) {
        return {
            success: true,
            dividend,
            divisor,
            quotient: Math.floor(dividend / divisor),
            remainder: dividend % divisor
        };
    }
};

// ==================== 게임 로직 ====================
function selectPlayers(num) {
    Sound.play('click');
    
    gameState.numPlayers = num;
    gameState.players = Array.from({ length: num }, (_, i) => ({
        id: i,
        name: `플레이어 ${i + 1}`,
        color: CONSTANTS.PLAYER_COLORS[i],
        position: CONSTANTS.STARTING_POSITION,
        order: null
    }));
    
    UI.showScreen('rpsScreen');
    autoRPSAndDetermineOrder();
}

function autoRPSAndDetermineOrder() {
    const container = document.getElementById('rpsPlayers');
    container.innerHTML = '';
    
    const results = gameState.players.map((player, index) => ({
        player,
        rpsChoice: CONSTANTS.RPS_CHOICES[Math.floor(Math.random() * 3)],
        diceRoll: Math.floor(Math.random() * 6) + 1,
        index
    }));
    
    results.forEach((result, i) => {
        setTimeout(() => {
            Sound.play('dice');
            
            const div = document.createElement('div');
            div.className = 'rps-player';
            div.style.animation = 'fadeIn 0.5s';
            div.innerHTML = `
                <h3>
                    <span class="player-color" style="background: ${result.player.color}"></span>
                    ${result.player.name}
                </h3>
                <div style="font-size: 2em; margin: 10px 0;">
                    ${CONSTANTS.RPS_EMOJI[result.rpsChoice]}
                </div>
                <div style="font-weight: bold; color: #667eea;">
                    ${CONSTANTS.RPS_TEXT[result.rpsChoice]} · 주사위: ${result.diceRoll}
                </div>
            `;
            container.appendChild(div);
            
            if (i === results.length - 1) {
                setTimeout(() => determineOrder(results), 800);
            }
        }, i * 500);
    });
}

function determineOrder(results) {
    results.sort((a, b) => b.diceRoll - a.diceRoll || a.index - b.index);
    
    results.forEach((r, i) => r.player.order = i + 1);
    gameState.players.sort((a, b) => a.order - b.order);
    
    let html = '<h3 style="margin-top: 30px;">🎲 플레이 순서가 결정되었습니다!</h3><div style="margin: 20px 0;">';
    results.forEach((r, i) => {
        html += `
            <div style="padding: 10px; margin: 5px 0; background: ${i === 0 ? '#fff3cd' : '#f8f9fa'}; 
                 border-radius: 8px; border-left: 4px solid ${r.player.color};">
                <strong>${i + 1}번째:</strong>
                <span class="player-color" style="background: ${r.player.color}; display: inline-block; 
                      width: 15px; height: 15px; border-radius: 50%; margin: 0 5px; vertical-align: middle;"></span>
                ${r.player.name} <span style="color: #666;">(주사위: ${r.diceRoll})</span>
            </div>
        `;
    });
    html += '</div>';
    
    UI.setHTML('rpsResult', html);
    Sound.play('correct');
    
    setTimeout(() => UI.show('startGameBtn'), 500);
}

function startGame() {
    Sound.play('click');
    UI.showScreen('gameScreen');
    initializeBoard();
    updatePlayersInfo();
    updateTurnInfo();
}

function initializeBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    board.style.width = `${BOARD_SETTINGS.width}px`;
    board.style.height = `${BOARD_SETTINGS.height}px`;
    
    gameState.boardCells = [];
    
    createBoardBackground(board);
    
    BOARD_DEFINITIONS.forEach((def, index) => {
        const cell = document.createElement('div');
        cell.className = `board-cell ${def.type}`;
        cell.dataset.index = index;
        
        const position = BOARD_POSITIONS[index];
        if (position) {
            cell.style.left = `${position.x}px`;
            cell.style.top = `${position.y}px`;
            cell.style.width = `${BOARD_SETTINGS.cellSize}px`;
            cell.style.height = `${BOARD_SETTINGS.cellSize}px`;
        }
        
        const cellNum = document.createElement('div');
        cellNum.className = 'cell-number';
        cellNum.textContent = index;
        cell.appendChild(cellNum);
        
        const content = document.createElement('div');
        content.className = 'division-display';
        
        if (def.type === 'division') {
            content.innerHTML = def.template.replace(/_/g, '<span class="blank-space"></span>').replace('÷', ' ÷ ');
            gameState.boardCells[index] = { ...def, filledValue: null };
        } else {
            content.innerHTML = def.text.replace(/\n/g, '<br>');
            gameState.boardCells[index] = { ...def };
        }
        
        cell.appendChild(content);
        
        const pieces = document.createElement('div');
        pieces.className = 'player-pieces';
        pieces.id = `pieces-${index}`;
        cell.appendChild(pieces);
        
        board.appendChild(cell);
    });
    
    updatePlayerPositions();
}

function getArrowDirection(index) {
    return '';
}

function updatePlayerPositions() {
    document.querySelectorAll('.player-pieces').forEach(div => div.innerHTML = '');
    
    gameState.players.forEach(player => {
        const div = document.getElementById(`pieces-${player.position}`);
        if (div) {
            const piece = document.createElement('div');
            piece.className = 'player-piece';
            piece.style.background = player.color;
            piece.title = player.name;
            div.appendChild(piece);
        }
    });
}

function updatePlayersInfo() {
    const container = document.getElementById('playersInfo');
    container.innerHTML = '<h3>플레이어 정보</h3>';
    
    gameState.players.forEach((player, i) => {
        const div = document.createElement('div');
        div.className = 'player-info';
        div.id = `player-info-${i}`;
        div.innerHTML = `
            <h3><span class="player-color" style="background: ${player.color}"></span>${player.name}</h3>
            <div class="player-position">위치: ${player.position}칸</div>
        `;
        container.appendChild(div);
    });
}

function updateTurnInfo() {
    const player = gameState.players[gameState.currentPlayerIndex];
    UI.setHTML('turnInfo', `
        <span class="player-color" style="background: ${player.color}"></span>
        ${player.name}의 차례입니다!
    `);
    
    document.querySelectorAll('.player-info').forEach((div, i) => {
        div.classList.toggle('active', i === gameState.currentPlayerIndex);
    });
}

function rollDice() {
    const btn = document.getElementById('rollDiceBtn');
    const resultDiv = document.getElementById('diceResult');
    
    btn.disabled = true;
    UI.setText('messageBox', '');
    
    let count = 0;
    const interval = setInterval(() => {
        resultDiv.textContent = CONSTANTS.DICE_EMOJIS[Math.floor(Math.random() * 6) + 1];
        
        if (count % 2 === 0) Sound.play('dice');
        
        if (++count >= CONSTANTS.DICE_ANIMATION_COUNT) {
            clearInterval(interval);
            gameState.diceValue = Math.floor(Math.random() * 6) + 1;
            resultDiv.textContent = CONSTANTS.DICE_EMOJIS[gameState.diceValue];
            
            setTimeout(() => handleDiceResult(), 500);
        }
    }, CONSTANTS.DICE_ANIMATION_INTERVAL);
}

function handleDiceResult() {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cell = gameState.boardCells[player.position];
    
    UI.setHTML('messageBox', '');
    document.getElementById('messageBox').className = 'message-box';
    
    if (cell.type === 'special') {
        UI.setText('messageBox', '특수 칸! 뒤로 2칸 이동합니다.');
        setTimeout(() => movePlayer(player, CONSTANTS.SPECIAL_MOVE), 1500);
    } else if (cell.type === 'start' || cell.type === 'end') {
        UI.setText('messageBox', '특별한 효과가 없습니다. 다음 턴으로 넘어갑니다.');
        setTimeout(nextTurn, 1500);
    } else if (cell.type === 'division') {
        const result = Division.calculate(cell.template, gameState.diceValue);
        if (result) {
            cell.filledValue = gameState.diceValue;
            updateBoardCell(player.position, gameState.diceValue);
            showRemainderQuestion(result);
        }
    }
}

function showRemainderQuestion(result) {
    showProcessSteps(result);
    
    UI.setHTML('divisionProblem', `
        <span>${result.dividend} ÷ ${result.divisor} = ${result.quotient} 나머지</span>
        <span class="problem-blank">?</span>
    `);
    UI.show('divisionProblem');
    
    const choices = generateChoices(result.remainder, result.divisor);
    const container = document.getElementById('choiceButtons');
    container.innerHTML = '';
    
    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice;
        btn.onclick = (event) => checkAnswer(choice, result.remainder, result, event.currentTarget);
        container.appendChild(btn);
    });
    
    UI.show('remainderChoices');
}

function showProcessSteps(result) {
    const processDiv = document.getElementById('processSteps');
    if (!processDiv) return;
    
    processDiv.classList.remove('hidden');
    UI.show('processSteps');
    
    const diceDisplay = document.getElementById('diceValueDisplay');
    const fillDisplay = document.getElementById('fillBlankDisplay');
    const calcDisplay = document.getElementById('calculationDisplay');
    const currentCell = gameState.boardCells[gameState.players[gameState.currentPlayerIndex].position];
    
    if (diceDisplay) {
        diceDisplay.innerHTML = `<span class="highlight">${gameState.diceValue}</span>`;
    }
    
    if (fillDisplay && currentCell?.template) {
        const filledTemplate = currentCell.template
            .replace('÷', ' ÷ ')
            .replace('_', `<span class="highlight">${gameState.diceValue}</span>`);
        fillDisplay.innerHTML = filledTemplate;
    } else if (fillDisplay) {
        fillDisplay.innerHTML = '';
    }
    
    if (calcDisplay) {
        calcDisplay.innerHTML = `
            ${result.dividend} ÷ ${result.divisor} = ${result.quotient}
            <span class="arrow">나머지</span>
            <span class="highlight">?</span>
        `;
    }
    
    processDiv.classList.remove('hidden');
}

function generateChoices(correct, divisor) {
    const safeDivisor = Number.isFinite(divisor) && divisor > 0 ? divisor : Math.max(correct + 1, 6);
    const choices = new Set([correct]);
    const maxAttempts = 100;
    let attempts = 0;
    const maxRange = Math.max(safeDivisor - 1, 5);
    
    while (choices.size < CONSTANTS.CHOICE_COUNT && attempts < maxAttempts) {
        const candidate = Math.floor(Math.random() * (maxRange + 1));
        choices.add(candidate);
        attempts++;
    }
    
    let fallback = 0;
    while (choices.size < CONSTANTS.CHOICE_COUNT) {
        if (!choices.has(fallback)) {
            choices.add(fallback);
        }
        fallback++;
    }
    return Array.from(choices).sort(() => Math.random() - 0.5);
}

function checkAnswer(selected, correct, result, targetButton) {
    const messageBox = document.getElementById('messageBox');
    const buttons = document.querySelectorAll('.choice-btn');
    
    buttons.forEach(btn => btn.disabled = true);
    
    if (selected === correct) {
        Sound.play('correct');
        
        messageBox.className = 'message-box correct';
        messageBox.innerHTML = `
            <div>
                <strong>🎉 정답입니다!</strong><br>
                ${result.dividend} ÷ ${result.divisor} = ${result.quotient} 나머지 ${correct}<br>
                ${correct > 0 ? `${correct}칸 앞으로 이동합니다!` : '나머지가 0입니다. 이동하지 않고 빈칸을 지웁니다.'}
            </div>
        `;
        
        targetButton.classList.add('correct');
        
        setTimeout(() => {
            hideRemainderQuestion();
            
            if (correct > 0) {
                movePlayer(gameState.players[gameState.currentPlayerIndex], correct);
            } else {
                const player = gameState.players[gameState.currentPlayerIndex];
                gameState.boardCells[player.position].filledValue = null;
                updateBoardCell(player.position);
                setTimeout(nextTurn, 1500);
            }
        }, 2000);
    } else {
        Sound.play('wrong');
        
        messageBox.className = 'message-box wrong';
        messageBox.innerHTML = '<div><strong>❌ 틀렸습니다!</strong><br>다시 계산해보세요!</div>';
        targetButton.classList.add('wrong');
        
        setTimeout(() => {
            messageBox.className = 'message-box';
            UI.setText('messageBox', '다시 선택해주세요!');
            
            buttons.forEach(btn => {
                if (!btn.classList.contains('wrong')) {
                    btn.disabled = false;
                }
            });
        }, 1000);
    }
}

function hideRemainderQuestion() {
    UI.hide('divisionProblem', 'remainderChoices', 'processSteps');
    const processDiv = document.getElementById('processSteps');
    if (processDiv) {
        processDiv.classList.add('hidden');
    }
    document.getElementById('messageBox').className = 'message-box';
}

function updateBoardCell(cellIndex, value = null) {
    const cell = gameState.boardCells[cellIndex];
    const elem = document.querySelector(`[data-index="${cellIndex}"] .division-display`);
    
    if (cell?.type === 'division' && elem) {
        const display = cell.template
            .replace('÷', ' ÷ ')
            .replace('_', value !== null ? `<span class="blank-space">${value}</span>` : '<span class="blank-space"></span>');
        elem.innerHTML = display;
    }
}

function createBoardBackground(container) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${BOARD_SETTINGS.width} ${BOARD_SETTINGS.height}`);
    svg.classList.add('board-background');
    
    const defs = document.createElementNS(svgNS, 'defs');
    const gradient = document.createElementNS(svgNS, 'linearGradient');
    gradient.setAttribute('id', 'boardGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#c0e6b4');
    
    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#9bd3f5');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
    
    const background = document.createElementNS(svgNS, 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'url(#boardGradient)');
    svg.appendChild(background);
    
    const path = document.createElementNS(svgNS, 'path');
    const pathData = BOARD_POSITIONS
        .map((pos, idx) => `${idx === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`)
        .join(' ');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#f8e1a6');
    path.setAttribute('stroke-width', '70');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    
    const edge = document.createElementNS(svgNS, 'path');
    edge.setAttribute('d', pathData);
    edge.setAttribute('fill', 'none');
    edge.setAttribute('stroke', '#d3b27f');
    edge.setAttribute('stroke-width', '8');
    edge.setAttribute('stroke-linecap', 'round');
    edge.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(edge);
    
    const startCircle = document.createElementNS(svgNS, 'circle');
    startCircle.setAttribute('cx', BOARD_POSITIONS[0].x);
    startCircle.setAttribute('cy', BOARD_POSITIONS[0].y);
    startCircle.setAttribute('r', 36);
    startCircle.setAttribute('fill', 'rgba(132, 250, 176, 0.6)');
    startCircle.setAttribute('stroke', '#2ecc71');
    startCircle.setAttribute('stroke-width', '4');
    svg.appendChild(startCircle);
    
    const startLabel = document.createElementNS(svgNS, 'text');
    startLabel.setAttribute('x', BOARD_POSITIONS[0].x);
    startLabel.setAttribute('y', BOARD_POSITIONS[0].y + 6);
    startLabel.setAttribute('text-anchor', 'middle');
    startLabel.setAttribute('font-size', '20');
    startLabel.setAttribute('font-family', 'NanumSquare, sans-serif');
    startLabel.setAttribute('fill', '#1b5e20');
    startLabel.textContent = '출발';
    svg.appendChild(startLabel);
    
    const endCircle = document.createElementNS(svgNS, 'circle');
    endCircle.setAttribute('cx', BOARD_POSITIONS[BOARD_POSITIONS.length - 1].x);
    endCircle.setAttribute('cy', BOARD_POSITIONS[BOARD_POSITIONS.length - 1].y);
    endCircle.setAttribute('r', 40);
    endCircle.setAttribute('fill', 'rgba(255, 235, 59, 0.6)');
    endCircle.setAttribute('stroke', '#f39c12');
    endCircle.setAttribute('stroke-width', '4');
    svg.appendChild(endCircle);
    
    const endLabel = document.createElementNS(svgNS, 'text');
    endLabel.setAttribute('x', BOARD_POSITIONS[BOARD_POSITIONS.length - 1].x);
    endLabel.setAttribute('y', BOARD_POSITIONS[BOARD_POSITIONS.length - 1].y + 6);
    endLabel.setAttribute('text-anchor', 'middle');
    endLabel.setAttribute('font-size', '20');
    endLabel.setAttribute('font-family', 'NanumSquare, sans-serif');
    endLabel.setAttribute('fill', '#e65100');
    endLabel.textContent = '도착';
    svg.appendChild(endLabel);
    
    container.appendChild(svg);
}

function movePlayer(player, steps) {
    Sound.play('move', steps);
    
    player.position = Math.max(0, Math.min(player.position + steps, BOARD_DEFINITIONS.length - 1));
    
    updatePlayerPositions();
    updatePlayersInfo();
    
    if (player.position >= BOARD_DEFINITIONS.length - 1) {
        endGame(player);
    } else {
        setTimeout(nextTurn, 1000);
    }
}

function nextTurn() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    updateTurnInfo();
    
    hideRemainderQuestion();
    document.getElementById('rollDiceBtn').disabled = false;
    UI.setText('diceResult', '');
    UI.setText('messageBox', '주사위를 던져주세요!');
    document.getElementById('messageBox').className = 'message-box';
}

function endGame(winner) {
    Sound.play('win');
    
    UI.showScreen('endScreen');
    UI.setHTML('winnerInfo', `
        <div class="winner-name">
            <span class="player-color" style="background: ${winner.color}"></span>
            ${winner.name}
        </div>
        <p>축하합니다! 🎉</p>
    `);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    
    btn.textContent = soundEnabled ? '🔊' : '🔇';
    btn.classList.toggle('muted', !soundEnabled);
    btn.title = soundEnabled ? '소리 끄기' : '소리 켜기';
    
    Sound.play('click');
}

function toggleGameRules() {
    Sound.play('click');
    
    const rules = document.getElementById('gameRulesInGame');
    rules.classList.toggle('show');
    rules.classList.toggle('hidden');
}

// 초기화
window.onload = () => UI.showScreen('startScreen');
