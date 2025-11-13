# 🐛 버그 수정 보고서 (Part 2)

**날짜**: 2025-01-13  
**버전**: v1.2.1  
**심각도**: 🔴 Critical (여전히 멈춤 발생)

---

## 📋 문제 상황

첫 번째 수정 후에도 **여전히 사이트 멈춤 현상** 발생
- 주사위를 돌리고 나머지를 입력하려고 할 때 멈춤
- 이전 수정으로 일부 개선되었으나 완전히 해결되지 않음

---

## 🔍 추가 원인 분석

### 문제 1: addEventListener의 중복 등록 방지 미흡

**발견된 문제**:
```javascript
// ❌ 이전 코드 (Line 549-550)
answerInput.onkeypress = null;
answerInput.addEventListener('keypress', handleAnswerKeyPress);
```

**문제점**:
- `addEventListener`는 같은 함수를 여러 번 등록해도 중복으로 추가됨
- `removeEventListener`를 먼저 호출하지 않아 계속 누적됨

**해결 방법**:
```javascript
// ✅ 수정된 코드
answerInput.onkeypress = null;
answerInput.removeEventListener('keypress', handleAnswerKeyPress); // 먼저 제거
answerInput.addEventListener('keypress', handleAnswerKeyPress); // 그 다음 등록
```

---

### 문제 2: 전역 상태 관리 부재

**발견된 문제**:
- 답안 제출 중인지 확인하는 전역 플래그가 없음
- 여러 경로로 `submitAnswer()` 호출 가능
  - Enter 키 (이벤트 리스너)
  - 확인 버튼 클릭
  - 빠른 연타 시 중복 실행

**해결 방법**:
```javascript
// gameState에 플래그 추가
const gameState = {
    // ... 기존 속성들 ...
    isSubmitting: false // 🔥 답안 제출 중 플래그
};

// submitAnswer() 함수 시작 부분
function submitAnswer() {
    // 🔥 전역 플래그로 중복 실행 완전 차단
    if (gameState.isSubmitting) {
        console.log('⚠️ 이미 제출 중입니다. 무시됨.');
        return;
    }
    // ...
}
```

---

### 문제 3: 플래그 해제 누락

**발견된 문제**:
- 정답 처리 후 플래그 해제가 누락됨
- 오답 처리 시에만 플래그 해제가 있었음
- 한 번 제출 후 영구적으로 막힐 수 있음

**해결 방법**:
```javascript
// ✅ checkAnswerWithInput() 시작 부분
function checkAnswerWithInput(userAnswer, correctAnswer, divisionResult) {
    gameState.isSubmitting = true; // 플래그 설정
    console.log('✅ 답안 처리 시작');
    // ...
}

// ✅ 오답 처리 후 플래그 해제
setTimeout(() => {
    // ... 초기화 코드 ...
    gameState.isSubmitting = false;
    console.log('✅ 오답 처리 완료, 다시 입력 가능');
}, 2000);

// ✅ 정답 처리 후 플래그 해제 (hideRemainderQuestion에서)
function hideRemainderQuestion() {
    // ... 정리 코드 ...
    gameState.isSubmitting = false;
    console.log('✅ 정답 처리 완료, 플래그 해제');
}
```

---

## ✅ 적용된 수정 사항

### 1. 이벤트 리스너 완전한 제거/등록

**파일**: `js/game.js` Line 548-551

```javascript
// Before
answerInput.onkeypress = null;
answerInput.addEventListener('keypress', handleAnswerKeyPress);

// After
answerInput.onkeypress = null;
answerInput.removeEventListener('keypress', handleAnswerKeyPress); // 먼저 제거
answerInput.addEventListener('keypress', handleAnswerKeyPress); // 그 다음 등록
```

---

### 2. 전역 제출 플래그 추가

**파일**: `js/game.js` Line 1-10

```javascript
const gameState = {
    numPlayers: 0,
    players: [],
    currentPlayerIndex: 0,
    boardCells: [],
    diceValue: 0,
    gamePhase: 'playerSelection',
    rpsResults: [],
    isSubmitting: false // 🔥 NEW: 답안 제출 중 플래그
};
```

---

### 3. submitAnswer() 강화

**파일**: `js/game.js` Line 595-620

```javascript
function submitAnswer() {
    // 🔥 전역 플래그로 중복 실행 완전 차단
    if (gameState.isSubmitting) {
        console.log('⚠️ 이미 제출 중입니다. 무시됨.');
        return;
    }
    
    const answerInput = document.getElementById('answerInput');
    const inputValue = answerInput.value.trim();
    const messageBox = document.getElementById('messageBox');
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // 🔥 이미 제출 중이면 중복 실행 방지
    if (answerInput.disabled || checkBtn.disabled) {
        console.log('⚠️ 입력창/버튼이 비활성화되어 있음. 무시됨.');
        return;
    }
    
    // ... 나머지 로직
}
```

---

### 4. checkAnswerWithInput() 플래그 설정

**파일**: `js/game.js` Line 671-680

```javascript
function checkAnswerWithInput(userAnswer, correctAnswer, divisionResult) {
    // 🔥 제출 중 플래그 설정
    gameState.isSubmitting = true;
    console.log('✅ 답안 처리 시작');
    
    const messageBox = document.getElementById('messageBox');
    const answerInput = document.getElementById('answerInput');
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // 입력창과 확인 버튼 비활성화
    answerInput.disabled = true;
    checkBtn.disabled = true;
    // ...
}
```

---

### 5. 오답 처리 후 플래그 해제

**파일**: `js/game.js` Line 738-758

```javascript
// 1.5초 후 다시 입력 가능하도록
setTimeout(() => {
    messageBox.className = 'message-box';
    messageBox.textContent = '정답을 다시 입력해주세요!';
    
    // 입력창 초기화
    answerInput.value = '';
    answerInput.disabled = false;
    // ... 스타일 초기화 ...
    
    checkBtn.disabled = false;
    
    // 🔥 오답 시에도 플래그 해제 (다시 입력 가능)
    gameState.isSubmitting = false;
    console.log('✅ 오답 처리 완료, 다시 입력 가능');
}, 2000);
```

---

### 6. 정답 처리 후 플래그 해제

**파일**: `js/game.js` Line 761-786

```javascript
function hideRemainderQuestion() {
    console.log('✅ 나머지 질문 숨기기 시작');
    
    document.getElementById('processSteps').classList.add('hidden');
    document.getElementById('remainderInput').classList.add('hidden');
    document.getElementById('messageBox').className = 'message-box';
    
    // 입력창 초기화
    const answerInput = document.getElementById('answerInput');
    // ... 초기화 코드 ...
    
    // 🔥 이벤트 리스너 제거 (메모리 누수 방지)
    answerInput.removeEventListener('keypress', handleAnswerKeyPress);
    answerInput.onkeypress = null;
    
    // 보기 숨기기
    document.getElementById('choiceButtons').classList.add('hidden');
    document.getElementById('choiceButtons').classList.remove('show');
    
    // 🔥 정답 처리 완료, 플래그 해제
    gameState.isSubmitting = false;
    console.log('✅ 정답 처리 완료, 플래그 해제');
}
```

---

## 🧪 디버깅 방법

브라우저 개발자 도구(F12)를 열고 Console 탭을 확인하세요.

### 정상 동작 시 콘솔 로그:
```
✅ 답안 처리 시작
✅ 나머지 질문 숨기기 시작
✅ 정답 처리 완료, 플래그 해제
```

### 오답 시 콘솔 로그:
```
✅ 답안 처리 시작
✅ 오답 처리 완료, 다시 입력 가능
```

### 중복 제출 시도 시:
```
⚠️ 이미 제출 중입니다. 무시됨.
```

---

## 📊 수정 사항 요약

| 수정 항목 | 파일 | 라인 | 효과 |
|----------|------|------|------|
| removeEventListener 추가 | game.js | 550 | 이벤트 리스너 중복 방지 |
| isSubmitting 플래그 | game.js | 9 | 전역 상태 관리 |
| submitAnswer 강화 | game.js | 595-604 | 중복 실행 차단 |
| 플래그 설정 | game.js | 671-673 | 제출 시작 표시 |
| 오답 플래그 해제 | game.js | 753-755 | 재입력 가능 |
| 정답 플래그 해제 | game.js | 782-784 | 다음 턴 준비 |
| 콘솔 로그 추가 | game.js | 여러 곳 | 디버깅 지원 |

---

## 🎯 테스트 체크리스트

### 필수 테스트
- [ ] 답안 입력 후 Enter 키 한 번만 작동
- [ ] 확인 버튼 연속 클릭 시 한 번만 실행
- [ ] 오답 입력 후 다시 입력 가능
- [ ] 정답 입력 후 다음 턴으로 정상 전환
- [ ] 5턴 이상 연속 진행
- [ ] Enter 키와 버튼 혼용 사용

### 스트레스 테스트
- [ ] 10턴 연속 진행
- [ ] 의도적 오답 5회 연속
- [ ] 빠른 Enter 키 연타
- [ ] 버튼 연속 클릭

---

## 📁 수정된 파일

- **js/game.js**: 
  - Line 9: `isSubmitting` 플래그 추가
  - Line 550: `removeEventListener` 추가
  - Line 595-604: `submitAnswer()` 강화
  - Line 671-673: 플래그 설정
  - Line 753-755: 오답 플래그 해제
  - Line 782-784: 정답 플래그 해제
  - 여러 곳: 디버깅용 콘솔 로그 추가

---

## 💡 핵심 개선 사항

### 3중 방어 시스템

1. **이벤트 리스너 레벨**
   - removeEventListener로 기존 리스너 제거
   - 새로운 리스너 단 하나만 등록

2. **전역 플래그 레벨**
   - `gameState.isSubmitting`으로 제출 중 상태 추적
   - 제출 중이면 모든 새 요청 무시

3. **UI 레벨**
   - 입력창과 버튼 disabled 속성으로 차단
   - 사용자가 실수로 클릭해도 무시

---

## ✅ 예상 효과

- ✅ 이벤트 리스너 중복 등록 완전 차단
- ✅ 답안 제출 중복 실행 불가능
- ✅ 플래그 관리로 상태 추적 명확
- ✅ 콘솔 로그로 문제 발생 시 즉시 파악
- ✅ 안정적인 장시간 플레이 가능

---

**테스트 요청**: 이제 게임을 플레이해보시고, 여전히 멈춤 현상이 발생하는지 확인해주세요. 발생 시 브라우저 Console 탭의 로그를 공유해주시면 추가 디버깅이 가능합니다.

---

**작성자**: AI Assistant  
**날짜**: 2025-01-13  
**상태**: ✅ 수정 완료, 테스트 대기
