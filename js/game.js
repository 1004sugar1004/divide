// 게임 상태
const gameState = {
    numPlayers: 0,
    players: [],
    currentPlayerIndex: 0,
    boardCells: [],
    diceValue: 0,
    gamePhase: 'playerSelection', // playerSelection, rps, game, end
    rpsResults: [],
    isSubmitting: false, // 🔥 FIX: 답안 제출 중 플래그
    activeTimeouts: [] // 🔥 FIX: 활성 타임아웃 추적
};

// 플레이어 색상
const playerColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];

// 보드 셀 정의 (PDF 이미지 기준)
const boardDefinitions = [
    { type: 'start', text: '시작' },
    { type: 'division', template: '5_÷3', blank: 'dividend1' },
    { type: 'division', template: '7_÷5', blank: 'dividend1' },
    { type: 'division', template: '3_÷2', blank: 'dividend1' },
    { type: 'division', template: '3÷4_', blank: 'divisor1' },
    { type: 'division', template: '_4÷8', blank: 'dividend0' },
    { type: 'division', template: '3_÷5', blank: 'dividend1' },
    { type: 'division', template: '1÷2_', blank: 'divisor1' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '5_÷6', blank: 'dividend1' },
    { type: 'division', template: '4_÷4', blank: 'dividend1' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '45_÷5', blank: 'dividend2' },
    { type: 'division', template: '23_÷7', blank: 'dividend2' },
    { type: 'division', template: '20_÷3', blank: 'dividend2' },
    { type: 'division', template: '92_÷4', blank: 'dividend2' },
    { type: 'division', template: '8_÷2', blank: 'dividend1' },
    { type: 'division', template: '81_÷4', blank: 'dividend2' },
    { type: 'division', template: '6÷4_', blank: 'divisor1' },
    { type: 'division', template: '_4÷4', blank: 'dividend0' },
    { type: 'division', template: '34_÷3', blank: 'dividend2' },
    { type: 'division', template: '13_÷9', blank: 'dividend2' },
    { type: 'special', text: '뒤로\n2칸\n이동' },
    { type: 'division', template: '1_÷3', blank: 'dividend1' },
    { type: 'division', template: '1_÷4', blank: 'dividend1' },
    { type: 'division', template: '25_÷4', blank: 'dividend2' },
    { type: 'end', text: '도착!' }
];

// 보드 레이아웃 경로 정의 (구불구불한 길 형태)
// 각 칸의 그리드 위치 [row, col]
const boardLayout = [
    [0, 0], // 0: 시작
    [0, 1], // 1
    [0, 2], // 2
    [0, 3], // 3
    [0, 4], // 4
    [1, 4], // 5
    [2, 4], // 6
    [3, 4], // 7
    [2, 5], // 8 (오른쪽 위)
    [1, 6], // 9 (더 오른쪽 위)
    [0, 7], // 10 (가장 오른쪽 위)
    [2, 3], // 11
    [2, 2], // 12
    [3, 3], // 13
    [2, 2], // 14
    [3, 2], // 15
    [2, 0], // 16 (왼쪽으로 이동)
    [3, 0], // 17 (왼쪽으로 이동)
    [4, 0], // 18 (왼쪽으로 이동)
    [4, 10], // 19 (오른쪽으로 크게 이동)
    [5, 4], // 20
    [5, 1], // 21
    [5, 2], // 22
    [5, 3], // 23
    [5, 4], // 24
    [6, 4], // 25
    [7, 4]  // 26: 도착 (길을 아래로 확장)
];

// 플레이어 수 선택
function selectPlayers(num) {
    playClickSound();
    
    gameState.numPlayers = num;
    gameState.players = [];
    
    for (let i = 0; i < num; i++) {
        gameState.players.push({
            id: i,
            name: num === 1 ? '나' : `플레이어 ${i + 1}`,
            color: playerColors[i],
            position: 1, // 1번 칸부터 시작
            order: i + 1 // 순서 미리 할당
        });
    }
    
    // 혼자 플레이면 바로 게임 시작
    if (num === 1) {
        setTimeout(() => {
            startGame();
        }, 500);
    } else {
        // 순서 결정 화면으로 이동
        showScreen('rpsScreen');
        autoRPSAndDetermineOrder();
    }
}

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 컴퓨터가 자동으로 가위바위보 하고 순서 결정
function autoRPSAndDetermineOrder() {
    const rpsPlayersDiv = document.getElementById('rpsPlayers');
    rpsPlayersDiv.innerHTML = '';
    
    const rpsChoices = ['rock', 'paper', 'scissors'];
    const rpsEmoji = {
        'rock': '✊',
        'paper': '✋',
        'scissors': '✌️'
    };
    const rpsText = {
        'rock': '바위',
        'paper': '보',
        'scissors': '가위'
    };
    
    // 각 플레이어에 대한 가위바위보 결과 생성
    const playerResults = gameState.players.map((player, index) => {
        const choice = rpsChoices[Math.floor(Math.random() * 3)];
        const diceRoll = Math.floor(Math.random() * 6) + 1;
        
        return {
            player: player,
            rpsChoice: choice,
            diceRoll: diceRoll,
            index: index
        };
    });
    
    // 애니메이션으로 하나씩 표시
    let delay = 0;
    playerResults.forEach((result, index) => {
        setTimeout(() => {
            playDiceSound();
            
            const playerDiv = document.createElement('div');
            playerDiv.className = 'rps-player';
            playerDiv.style.animation = 'fadeIn 0.5s';
            playerDiv.innerHTML = `
                <h3>
                    <span class="player-color" style="background: ${result.player.color}"></span>
                    ${result.player.name}
                </h3>
                <div style="font-size: 2em; margin: 10px 0;">
                    ${rpsEmoji[result.rpsChoice]}
                </div>
                <div style="font-weight: bold; color: #667eea;">
                    ${rpsText[result.rpsChoice]} · 주사위: ${result.diceRoll}
                </div>
            `;
            rpsPlayersDiv.appendChild(playerDiv);
            
            // 마지막 플레이어 표시 후 순서 결정
            if (index === playerResults.length - 1) {
                setTimeout(() => {
                    determineOrder(playerResults);
                }, 800);
            }
        }, delay);
        delay += 500;
    });
}

// 게임 시작 시 모든 플레이어를 1번 칸에 배치
function placePlayersAtStart() {
    gameState.players.forEach(player => {
        player.position = 1; // 0번(시작)이 아니라 1번 칸부터 시작
    });
}

// 순서 결정
function determineOrder(playerResults) {
    // 주사위 값으로 정렬 (내림차순)
    playerResults.sort((a, b) => {
        if (b.diceRoll !== a.diceRoll) {
            return b.diceRoll - a.diceRoll;
        }
        // 주사위가 같으면 가위바위보 결과로 (임의)
        return a.index - b.index;
    });
    
    // 순서 할당
    playerResults.forEach((result, index) => {
        result.player.order = index + 1;
    });
    
    // 플레이어 배열을 순서대로 재정렬
    gameState.players.sort((a, b) => a.order - b.order);
    
    // 결과 표시
    const resultDiv = document.getElementById('rpsResult');
    let resultHTML = '<h3 style="margin-top: 30px;">🎲 플레이 순서가 결정되었습니다!</h3>';
    resultHTML += '<div style="margin: 20px 0;">';
    playerResults.forEach((result, index) => {
        resultHTML += `
            <div style="padding: 10px; margin: 5px 0; background: ${index === 0 ? '#fff3cd' : '#f8f9fa'}; border-radius: 8px; border-left: 4px solid ${result.player.color};">
                <strong>${index + 1}번째:</strong> 
                <span class="player-color" style="background: ${result.player.color}; display: inline-block; width: 15px; height: 15px; border-radius: 50%; margin: 0 5px; vertical-align: middle;"></span>
                ${result.player.name} 
                <span style="color: #666;">(주사위: ${result.diceRoll})</span>
            </div>
        `;
    });
    resultHTML += '</div>';
    resultDiv.innerHTML = resultHTML;
    
    playCorrectSound();
    
    // 게임 시작 버튼 표시
    setTimeout(() => {
        document.getElementById('startGameBtn').classList.remove('hidden');
    }, 500);
}

// 게임 시작
function startGame() {
    playClickSound();
    
    // 모든 플레이어를 1번 칸에 배치
    placePlayersAtStart();
    
    showScreen('gameScreen');
    initializeBoard();
    updatePlayersInfo();
    updateTurnInfo();
}

// 보드 초기화 (구불구불한 경로 형태)
function initializeBoard() {
    const boardDiv = document.getElementById('gameBoard');
    boardDiv.innerHTML = '';
    gameState.boardCells = [];
    
    // 그리드 셋업
    boardDiv.style.gridTemplateColumns = 'repeat(5, 1fr)';
    boardDiv.style.gridTemplateRows = 'repeat(6, 1fr)';
    
    boardDefinitions.forEach((cellDef, index) => {
        const cell = document.createElement('div');
        cell.className = `board-cell ${cellDef.type}`;
        cell.dataset.index = index;
        
        // 그리드 위치 설정
        const [row, col] = boardLayout[index];
        cell.style.gridRow = row + 1;
        cell.style.gridColumn = col + 1;
        
        // 화살표 표시
        if (index > 0) {
            const arrow = document.createElement('div');
            arrow.className = 'path-arrow';
            const direction = getArrowDirection(index);
            arrow.textContent = direction;
            cell.appendChild(arrow);
        }
        
        // 셀 번호
        const cellNumber = document.createElement('div');
        cellNumber.className = 'cell-number';
        cellNumber.textContent = index;
        cell.appendChild(cellNumber);
        
        // 셀 내용
        const content = document.createElement('div');
        content.className = 'division-display';
        
        if (cellDef.type === 'division') {
            content.innerHTML = formatDivisionTemplate(cellDef.template, cellDef.blank);
            gameState.boardCells[index] = {
                ...cellDef,
                filledValue: null
            };
        } else {
            content.innerHTML = cellDef.text.replace(/\n/g, '<br>');
            gameState.boardCells[index] = { ...cellDef };
        }
        
        cell.appendChild(content);
        
        // 플레이어 말 표시 영역
        const piecesDiv = document.createElement('div');
        piecesDiv.className = 'player-pieces';
        piecesDiv.id = `pieces-${index}`;
        cell.appendChild(piecesDiv);
        
        boardDiv.appendChild(cell);
    });
    
    // 1번 칸에 모든 플레이어 배치
    updatePlayerPositions();
}

// 화살표 방향 결정
function getArrowDirection(index) {
    if (index === 0) return '';
    const [prevRow, prevCol] = boardLayout[index - 1];
    const [currRow, currCol] = boardLayout[index];
    
    if (currCol > prevCol) return '→'; // 오른쪽
    if (currCol < prevCol) return '←'; // 왼쪽
    if (currRow > prevRow) return '↓'; // 아래
    if (currRow < prevRow) return '↑'; // 위
    return '';
}

// 나눗셈 템플릿 포맷팅
function formatDivisionTemplate(template, blankType) {
    if (blankType === 'none') {
        return template.replace('÷', ' ÷ ');
    }
    
    // 빈칸을 HTML로 변환
    return template.replace(/_/g, '<span class="blank-space" id="blank"></span>').replace('÷', ' ÷ ');
}

// 플레이어 위치 업데이트
function updatePlayerPositions() {
    // 모든 플레이어 말 제거
    document.querySelectorAll('.player-pieces').forEach(div => {
        div.innerHTML = '';
    });
    
    // 각 플레이어의 현재 위치에 말 표시
    gameState.players.forEach(player => {
        const piecesDiv = document.getElementById(`pieces-${player.position}`);
        const piece = document.createElement('div');
        piece.className = 'player-piece';
        piece.style.background = player.color;
        piece.title = player.name;
        piecesDiv.appendChild(piece);
    });
}

// 플레이어 정보 업데이트
function updatePlayersInfo() {
    const playersInfoDiv = document.getElementById('playersInfo');
    playersInfoDiv.innerHTML = '<h3>플레이어 정보</h3>';
    
    gameState.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-info';
        playerDiv.id = `player-info-${index}`;
        playerDiv.innerHTML = `
            <h3><span class="player-color" style="background: ${player.color}"></span>${player.name}</h3>
            <div class="player-position">위치: ${player.position}칸</div>
        `;
        playersInfoDiv.appendChild(playerDiv);
    });
}

// 턴 정보 업데이트
function updateTurnInfo() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const turnInfoDiv = document.getElementById('turnInfo');
    turnInfoDiv.innerHTML = `
        <span class="player-color" style="background: ${currentPlayer.color}"></span>
        ${currentPlayer.name}의 차례입니다!
    `;
    
    // 플레이어 정보에서 현재 플레이어 강조
    document.querySelectorAll('.player-info').forEach((div, index) => {
        if (index === gameState.currentPlayerIndex) {
            div.classList.add('active');
        } else {
            div.classList.remove('active');
        }
    });
}

// 주사위 굴리기
function rollDice() {
    const rollBtn = document.getElementById('rollDiceBtn');
    const diceResultDiv = document.getElementById('diceResult');
    const messageBox = document.getElementById('messageBox');
    
    // 🔥 FIX: 이미 주사위를 굴리는 중이면 무시
    if (rollBtn.disabled) {
        console.log('⚠️ 이미 주사위를 굴리는 중');
        return;
    }
    
    rollBtn.disabled = true;
    messageBox.textContent = '';
    
    // 주사위 애니메이션
    let count = 0;
    const interval = setInterval(() => {
        const tempValue = Math.floor(Math.random() * 6) + 1;
        diceResultDiv.textContent = getDiceEmoji(tempValue);
        
        // 주사위 굴리는 소리
        if (count % 2 === 0) {
            playDiceSound();
        }
        
        count++;
        
        if (count >= 10) {
            clearInterval(interval);
            gameState.diceValue = Math.floor(Math.random() * 6) + 1;
            diceResultDiv.textContent = getDiceEmoji(gameState.diceValue);
            
            // 주사위를 굴린 후 칸 처리
            setTimeout(() => {
                handleDiceResult();
            }, 500);
        }
    }, 100);
}

// 주사위 이모지
function getDiceEmoji(value) {
    const diceEmojis = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceEmojis[value];
}

// 주사위 결과 처리
function handleDiceResult() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const currentCell = gameState.boardCells[currentPlayer.position];
    const messageBox = document.getElementById('messageBox');
    
    messageBox.className = 'message-box';
    messageBox.textContent = '';
    
    // 특수 칸 처리
    if (currentCell.type === 'special') {
        messageBox.textContent = '특수 칸! 뒤로 2칸 이동합니다.';
        setTimeout(() => {
            movePlayer(currentPlayer, -2);
        }, 1500);
        return;
    }
    
    // 시작/도착 칸
    if (currentCell.type === 'start' || currentCell.type === 'end') {
        messageBox.textContent = '특별한 효과가 없습니다. 다음 턴으로 넘어갑니다.';
        setTimeout(() => {
            nextTurn();
        }, 1500);
        return;
    }
    
    // 나눗셈 칸
    if (currentCell.type === 'division') {
        // 빈칸이 있는 경우
        if (currentCell.blank && currentCell.blank !== 'none') {
            const result = fillDivisionBlank(currentPlayer.position, gameState.diceValue);
            
            if (result.success) {
                // 학생이 나머지를 계산하도록 문제 표시
                showRemainderQuestion(result);
            }
        } else {
            // 빈칸이 없는 고정된 나눗셈 - 그냥 계산
            const result = calculateFixedDivision(currentCell.template);
            if (result) {
                showRemainderQuestion(result);
            }
        }
    }
}

// 나머지 계산 문제 표시
let selectedAnswer = null;

function showRemainderQuestion(divisionResult) {
    selectedAnswer = null;
    
    // 단계별 과정 표시
    showProcessSteps(divisionResult);
    
    // 나머지 입력 섹션 표시
    setTimeout(() => {
        showRemainderInput(divisionResult);
    }, 1500);
}

// 단계별 과정 표시
function showProcessSteps(result) {
    const processDiv = document.getElementById('processSteps');
    const currentCell = gameState.boardCells[gameState.players[gameState.currentPlayerIndex].position];
    
    // 1단계: 주사위 결과
    document.getElementById('diceValueDisplay').innerHTML = `
        <span class="highlight">${gameState.diceValue}</span>
    `;
    
    // 2단계: 빈칸에 숫자 넣기
    const template = currentCell.template;
    const filled = template.replace('_', `<span class="highlight">${gameState.diceValue}</span>`).replace('÷', ' ÷ ');
    document.getElementById('fillBlankDisplay').innerHTML = filled;
    
    // 3단계: 나눗셈 계산
    document.getElementById('calculationDisplay').innerHTML = `
        ${result.dividend} ÷ ${result.divisor} = ${result.quotient} 
        <span class="arrow">나머지</span> 
        <span class="highlight">?</span>
    `;
    
    processDiv.classList.remove('hidden');
}

// 나머지 입력 섹션 표시
function showRemainderInput(result) {
    console.log('🎯 showRemainderInput 시작');
    
    const inputDiv = document.getElementById('remainderInput');
    const answerInput = document.getElementById('answerInput');
    const buttonsDiv = document.getElementById('choiceButtons');
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // 🔥 FIX: 모든 이벤트 핸들러 완전히 제거
    const newInput = answerInput.cloneNode(true);
    answerInput.parentNode.replaceChild(newInput, answerInput);
    const freshInput = document.getElementById('answerInput');
    
    // 입력창 초기화
    freshInput.value = '';
    freshInput.disabled = false;
    buttonsDiv.innerHTML = '';
    buttonsDiv.classList.add('hidden');
    checkBtn.disabled = false;
    
    // 정답 저장
    gameState.correctAnswer = result.remainder;
    gameState.currentResult = result;
    
    // 보기 버튼 생성 (숨겨진 상태)
    const choices = generateChoices(result.remainder, result.divisor);
    choices.forEach(choice => {
        const button = document.createElement('button');
        button.className = 'choice-btn';
        button.textContent = choice;
        button.onclick = () => fillAnswerFromChoice(choice);
        buttonsDiv.appendChild(button);
    });
    
    inputDiv.classList.remove('hidden');
    
    // 입력창에 포커스
    setTimeout(() => {
        freshInput.focus();
    }, 300);
    
    console.log('✅ showRemainderInput 완료');
}

// 보기에서 답 선택 시 입력창에 채우기
function fillAnswerFromChoice(choice) {
    const answerInput = document.getElementById('answerInput');
    answerInput.value = choice;
    answerInput.focus();
    playClickSound();
}

// 보기 토글
function toggleChoices() {
    const buttonsDiv = document.getElementById('choiceButtons');
    
    if (buttonsDiv.classList.contains('hidden')) {
        buttonsDiv.classList.remove('hidden');
        buttonsDiv.classList.add('show');
    } else {
        buttonsDiv.classList.remove('show');
        buttonsDiv.classList.add('hidden');
    }
    
    playClickSound();
}

// 답안 제출
function submitAnswer() {
    console.log('📝 submitAnswer 호출됨');
    
    // 🔥 FIX: 전역 플래그로 중복 실행 완전 차단
    if (gameState.isSubmitting) {
        console.log('⚠️ 이미 제출 중입니다. 무시됨.');
        return;
    }
    
    const answerInput = document.getElementById('answerInput');
    if (!answerInput) {
        console.log('⚠️ 입력창을 찾을 수 없음');
        return;
    }
    
    const inputValue = answerInput.value.trim();
    const messageBox = document.getElementById('messageBox');
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // 🔥 FIX: 이미 제출 중이면 중복 실행 방지
    if (answerInput.disabled || checkBtn.disabled) {
        console.log('⚠️ 입력창/버튼이 비활성화되어 있음. 무시됨.');
        return;
    }
    
    console.log('✅ submitAnswer 검증 통과, 처리 시작');
    
    // 입력값 검증
    if (inputValue === '') {
        messageBox.className = 'message-box wrong';
        messageBox.textContent = '⚠️ 답을 입력해주세요!';
        playWrongSound();
        answerInput.focus();
        
        setTimeout(() => {
            messageBox.className = 'message-box';
            messageBox.textContent = '';
        }, 1500);
        return;
    }
    
    const userAnswer = parseInt(inputValue);
    
    // 숫자 유효성 검사
    if (isNaN(userAnswer) || userAnswer < 0) {
        messageBox.className = 'message-box wrong';
        messageBox.textContent = '⚠️ 0 이상의 숫자를 입력해주세요!';
        playWrongSound();
        answerInput.focus();
        
        setTimeout(() => {
            messageBox.className = 'message-box';
            messageBox.textContent = '';
        }, 1500);
        return;
    }
    
    // 답 확인
    checkAnswerWithInput(userAnswer, gameState.correctAnswer, gameState.currentResult);
}

// 선택지 생성 (정답 + 오답들)
function generateChoices(correctAnswer, divisor) {
    const choices = new Set([correctAnswer]);
    
    // 오답 생성 (나머지는 0 ~ divisor-1 범위)
    while (choices.size < 6) {
        const wrongAnswer = Math.floor(Math.random() * divisor);
        choices.add(wrongAnswer);
    }
    
    // 배열로 변환하고 섞기
    const choicesArray = Array.from(choices);
    for (let i = choicesArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choicesArray[i], choicesArray[j]] = [choicesArray[j], choicesArray[i]];
    }
    
    return choicesArray;
}

// 🔥 FIX: 모든 활성 타임아웃 취소
function clearAllTimeouts() {
    gameState.activeTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
    });
    gameState.activeTimeouts = [];
    console.log('🧹 모든 타임아웃 취소됨');
}

// 답안 확인 (입력용)
function checkAnswerWithInput(userAnswer, correctAnswer, divisionResult) {
    // 🔥 FIX: 이전 타임아웃들 모두 취소
    clearAllTimeouts();
    
    // 🔥 FIX: 제출 중 플래그 설정
    gameState.isSubmitting = true;
    console.log('✅ 답안 처리 시작');
    
    const messageBox = document.getElementById('messageBox');
    const answerInput = document.getElementById('answerInput');
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // 입력창과 확인 버튼 비활성화
    answerInput.disabled = true;
    checkBtn.disabled = true;
    
    if (userAnswer === correctAnswer) {
        // 정답 소리!
        playCorrectSound();
        
        // 입력창 정답 스타일
        answerInput.style.borderColor = '#28a745';
        answerInput.style.background = '#d4edda';
        answerInput.style.color = '#155724';
        
        messageBox.className = 'message-box correct';
        messageBox.innerHTML = `
            <div>
                <strong>🎉 정답입니다!</strong><br>
                ${divisionResult.dividend} ÷ ${divisionResult.divisor} = ${divisionResult.quotient} <strong>나머지 ${correctAnswer}</strong><br>
                ${correctAnswer > 0 ? `<strong>${correctAnswer}칸</strong> 앞으로 이동합니다!` : '나머지가 0입니다. 이동하지 않고 빈칸을 지웁니다.'}
            </div>
        `;
        
        const timeoutId1 = setTimeout(() => {
            hideRemainderQuestion();
            
            if (correctAnswer > 0) {
                const currentPlayer = gameState.players[gameState.currentPlayerIndex];
                movePlayer(currentPlayer, correctAnswer);
            } else {
                // 나머지가 0이면 빈칸 지우기
                const currentPlayer = gameState.players[gameState.currentPlayerIndex];
                const currentCell = gameState.boardCells[currentPlayer.position];
                currentCell.filledValue = null;
                updateBoardCell(currentPlayer.position);
                
                const timeoutId2 = setTimeout(() => {
                    nextTurn();
                }, 1500);
                gameState.activeTimeouts.push(timeoutId2);
            }
        }, 2500);
        gameState.activeTimeouts.push(timeoutId1);
        
    } else {
        // 오답 소리
        playWrongSound();
        
        // 입력창 오답 스타일
        answerInput.style.borderColor = '#dc3545';
        answerInput.style.background = '#f8d7da';
        answerInput.style.color = '#721c24';
        answerInput.classList.add('shake');
        
        messageBox.className = 'message-box wrong';
        messageBox.innerHTML = `
            <div>
                <strong>❌ 틀렸습니다!</strong><br>
                입력한 답: <strong>${userAnswer}</strong><br>
                다시 계산하고 입력해주세요!<br>
                <small>힌트: ${divisionResult.dividend} ÷ ${divisionResult.divisor}를 계산해보세요</small>
            </div>
        `;
        
        // 1.5초 후 다시 입력 가능하도록
        const timeoutId3 = setTimeout(() => {
            messageBox.className = 'message-box';
            messageBox.textContent = '정답을 다시 입력해주세요!';
            
            // 🔥 FIX: 먼저 플래그 해제
            gameState.isSubmitting = false;
            console.log('✅ 오답 처리 완료, 다시 입력 가능');
            
            // 입력창 초기화
            answerInput.value = '';
            answerInput.disabled = false;
            answerInput.style.borderColor = '#667eea';
            answerInput.style.background = '#f0f8ff';
            answerInput.style.color = '#1565c0';
            answerInput.classList.remove('shake');
            
            checkBtn.disabled = false;
            
            // 🔥 FIX: 포커스는 마지막에 (이벤트 핸들러가 이미 등록되어 있음)
            const timeoutId4 = setTimeout(() => {
                answerInput.focus();
            }, 100);
            gameState.activeTimeouts.push(timeoutId4);
        }, 2000);
        gameState.activeTimeouts.push(timeoutId3);
    }
}

// 나머지 질문 숨기기
function hideRemainderQuestion() {
    console.log('🧹 hideRemainderQuestion 시작');
    
    document.getElementById('processSteps').classList.add('hidden');
    document.getElementById('remainderInput').classList.add('hidden');
    document.getElementById('messageBox').className = 'message-box';
    
    // 입력창 초기화
    const answerInput = document.getElementById('answerInput');
    if (answerInput) {
        answerInput.value = '';
        answerInput.disabled = false;
        answerInput.style.borderColor = '#667eea';
        answerInput.style.background = '#f0f8ff';
        answerInput.style.color = '#1565c0';
        answerInput.classList.remove('shake');
    }
    
    // 보기 숨기기
    document.getElementById('choiceButtons').classList.add('hidden');
    document.getElementById('choiceButtons').classList.remove('show');
    
    // 🔥 FIX: 정답 처리 완료, 플래그 해제
    gameState.isSubmitting = false;
    console.log('✅ hideRemainderQuestion 완료, 플래그 해제');
}

// 고정된 나눗셈 계산 (빈칸이 없는 경우)
function calculateFixedDivision(template) {
    // 예: "5÷3", "7÷2" 같은 완성된 나눗셈
    const match = template.match(/(\d+)÷(\d+)/);
    if (!match) return null;
    
    const dividend = parseInt(match[1]);
    const divisor = parseInt(match[2]);
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    
    return {
        success: true,
        dividend: dividend,
        divisor: divisor,
        quotient: quotient,
        remainder: remainder
    };
}

// 나눗셈 빈칸 채우기
function fillDivisionBlank(cellIndex, diceValue) {
    const cell = gameState.boardCells[cellIndex];
    cell.filledValue = diceValue;
    
    // 템플릿에서 숫자 추출
    let template = cell.template;
    let dividend, divisor;
    
    if (cell.blank === 'dividend0') {
        // 백의 자리가 빈칸 (예: _4÷8)
        const match = template.match(/_(\d+)÷(\d+)/);
        dividend = parseInt(diceValue.toString() + match[1]);
        divisor = parseInt(match[2]);
    } else if (cell.blank === 'dividend1') {
        // 일의 자리가 빈칸 (예: 3_÷4)
        const match = template.match(/(\d+)_÷(\d+)/);
        dividend = parseInt(match[1] + diceValue.toString());
        divisor = parseInt(match[2]);
    } else if (cell.blank === 'dividend2') {
        // 세 자리 수 일의 자리가 빈칸 (예: 45_÷5)
        const match = template.match(/(\d+)_÷(\d+)/);
        dividend = parseInt(match[1] + diceValue.toString());
        divisor = parseInt(match[2]);
    } else if (cell.blank === 'divisor0') {
        // 나누는 수 십의 자리가 빈칸 (예: 8÷_4)
        const match = template.match(/(\d+)÷_(\d+)/);
        dividend = parseInt(match[1]);
        divisor = parseInt(diceValue.toString() + match[2]);
    } else if (cell.blank === 'divisor1') {
        // 나누는 수 일의 자리가 빈칸 (예: 6÷2_)
        const match = template.match(/(\d+)÷(\d+)_/);
        dividend = parseInt(match[1]);
        divisor = parseInt(match[2] + diceValue.toString());
    }
    
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    
    // 보드 셀 업데이트
    updateBoardCell(cellIndex, diceValue);
    
    return {
        success: true,
        dividend: dividend,
        divisor: divisor,
        quotient: quotient,
        remainder: remainder
    };
}

// 보드 셀 시각적 업데이트
function updateBoardCell(cellIndex, filledValue = null) {
    const cell = gameState.boardCells[cellIndex];
    const cellElement = document.querySelector(`[data-index="${cellIndex}"] .division-display`);
    
    if (cell.type === 'division') {
        let display = cell.template.replace('÷', ' ÷ ');
        
        if (filledValue !== null) {
            display = display.replace('_', `<span class="blank-space">${filledValue}</span>`);
        } else {
            display = display.replace('_', '<span class="blank-space"></span>');
        }
        
        cellElement.innerHTML = display;
    }
}

// 플레이어 이동
function movePlayer(player, steps) {
    // 이동 소리
    playMoveSound(steps);
    
    const newPosition = Math.max(0, Math.min(player.position + steps, boardDefinitions.length - 1));
    player.position = newPosition;
    
    updatePlayerPositions();
    updatePlayersInfo();
    
    // 도착 확인
    if (player.position >= boardDefinitions.length - 1) {
        endGame(player);
    } else {
        setTimeout(() => {
            nextTurn();
        }, 1000);
    }
}

// 다음 턴
function nextTurn() {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.numPlayers;
    updateTurnInfo();
    
    const rollBtn = document.getElementById('rollDiceBtn');
    const diceResultDiv = document.getElementById('diceResult');
    const messageBox = document.getElementById('messageBox');
    
    // UI 초기화
    hideRemainderQuestion();
    rollBtn.disabled = false;
    diceResultDiv.textContent = '';
    messageBox.className = 'message-box';
    messageBox.textContent = '주사위를 던져주세요!';
}

// 게임 종료
function endGame(winner) {
    // 승리 팡파레!
    playWinSound();
    
    showScreen('endScreen');
    const winnerInfoDiv = document.getElementById('winnerInfo');
    winnerInfoDiv.innerHTML = `
        <div class="winner-name">
            <span class="player-color" style="background: ${winner.color}"></span>
            ${winner.name}
        </div>
        <p>축하합니다! 🎉</p>
    `;
}

// ==================== 사운드 시스템 (Web Audio API) ====================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;
let activeOscillators = []; // 🔥 FIX: oscillator 추적 배열

// 사운드 토글
function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('soundToggle');
    
    if (soundEnabled) {
        soundBtn.textContent = '🔊';
        soundBtn.classList.remove('muted');
        soundBtn.title = '소리 끄기';
    } else {
        soundBtn.textContent = '🔇';
        soundBtn.classList.add('muted');
        soundBtn.title = '소리 켜기';
    }
    
    playClickSound();
}

// 게임 방법 토글
function toggleGameRules() {
    playClickSound();
    
    const rulesDiv = document.getElementById('gameRulesInGame');
    
    if (rulesDiv.classList.contains('show')) {
        rulesDiv.classList.remove('show');
        rulesDiv.classList.add('hidden');
    } else {
        rulesDiv.classList.remove('hidden');
        rulesDiv.classList.add('show');
    }
}

// 주사위 굴리기 소리
function playDiceSound() {
    if (!soundEnabled) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
    
    // 🔥 FIX: oscillator 자동 정리
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

// 정답 소리 (상승하는 멜로디)
function playCorrectSound() {
    if (!soundEnabled) return;
    
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.1);
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
        
        // 🔥 FIX: oscillator 자동 정리
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    });
}

// 오답 소리 (하강하는 소리)
function playWrongSound() {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // 🔥 FIX: oscillator 자동 정리
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

// 이동 소리 (뽁뽁뽁)
function playMoveSound(steps) {
    if (!soundEnabled) return;
    
    for (let i = 0; i < Math.abs(steps); i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = steps > 0 ? 600 : 300; // 앞으로는 높은 음, 뒤로는 낮은 음
        oscillator.type = 'square';
        
        const startTime = audioContext.currentTime + (i * 0.15);
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
        
        // 🔥 FIX: oscillator 자동 정리
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }
}

// 승리 소리 (팡파레)
function playWinSound() {
    if (!soundEnabled) return;
    
    const melody = [
        {freq: 523.25, time: 0},    // C5
        {freq: 659.25, time: 0.15},  // E5
        {freq: 783.99, time: 0.3},   // G5
        {freq: 1046.5, time: 0.45},  // C6
    ];
    
    melody.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + note.time;
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
        
        // 🔥 FIX: oscillator 자동 정리
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    });
}

// 버튼 클릭 소리
function playClickSound() {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
    
    // 🔥 FIX: oscillator 자동 정리
    oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
    };
}

// 초기화
window.onload = function() {
    showScreen('startScreen');
};
