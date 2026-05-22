document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.getElementById('tambola-board');
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentNumberDisplay = document.getElementById('current-number');
    const generateTicketBtn = document.getElementById('generate-ticket-btn');
    const ticketContainer = document.getElementById('ticket-container');
    const autoDrawBtn = document.getElementById('auto-draw-btn');
    const autoDrawSpeed = document.getElementById('auto-draw-speed');
    const playerCountInput = document.getElementById('player-count');
    const leaderboardList = document.getElementById('leaderboard-list');

    let drawnNumbers = new Set();
    const totalNumbers = 90;
    let autoDrawInterval = null;
    let finishedPlayers = new Set();

    // Initialize 1-90 board
    function initBoard() {
        boardContainer.innerHTML = '';
        for (let i = 1; i <= totalNumbers; i++) {
            const cell = document.createElement('div');
            cell.classList.add('board-cell');
            cell.id = `board-cell-${i}`;
            cell.textContent = i;
            boardContainer.appendChild(cell);
        }
    }

    // Reset game state
    function resetGame() {
        drawnNumbers.clear();
        currentNumberDisplay.textContent = '--';
        document.querySelectorAll('.board-cell.drawn').forEach(cell => {
            cell.classList.remove('drawn');
        });
        stopAutoDraw();
        finishedPlayers.clear();
        leaderboardList.innerHTML = '<li class="empty-state">No winners yet!</li>';
        generateTickets(); // Regenerate tickets
    }

    function speakNumber(num) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Clear any ongoing speech
            
            let textToSpeak = `Number ${num}`;
            if (num > 9) {
                const digits = num.toString().split('');
                textToSpeak = `${digits[0]} ${digits[1]}, ${num}`;
            } else {
                textToSpeak = `Single number, ${num}`;
            }
            
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = 0.9; // Slightly slower for clarity
            window.speechSynthesis.speak(utterance);
        }
    }

    // Draw a random number
    function drawNumber() {
        if (drawnNumbers.size >= totalNumbers) {
            alert('All numbers have been drawn!');
            return;
        }

        let num;
        do {
            num = Math.floor(Math.random() * totalNumbers) + 1;
        } while (drawnNumbers.has(num));

        drawnNumbers.add(num);
        currentNumberDisplay.textContent = num;
        
        // Announce the number
        speakNumber(num);
        
        // Add subtle animation and highlight on the board
        const cell = document.getElementById(`board-cell-${num}`);
        if (cell) {
            cell.classList.add('drawn');
        }

        // Highlight number on ticket if it exists
        document.querySelectorAll('.ticket-cell').forEach(tCell => {
            if (tCell.textContent == num && !tCell.classList.contains('empty')) {
                tCell.classList.add('marked');
            }
        });
        
        checkWinners();
    }

    function checkWinners() {
        document.querySelectorAll('[data-player]').forEach(wrapper => {
            const playerNum = wrapper.dataset.player;
            if (finishedPlayers.has(playerNum)) return;
            
            const numberCells = wrapper.querySelectorAll('.ticket-cell:not(.empty)');
            const markedCells = wrapper.querySelectorAll('.ticket-cell.marked');
            
            // 15 numbers total, if all are marked it's a Full House
            if (numberCells.length > 0 && numberCells.length === markedCells.length) {
                finishedPlayers.add(playerNum);
                const playerNameInput = wrapper.querySelector('.player-name-input');
                const playerName = playerNameInput ? playerNameInput.value : `Player ${playerNum}`;
                addToLeaderboard(playerNum, playerName);
            }
        });
    }

    function addToLeaderboard(playerNum, playerName) {
        const emptyState = leaderboardList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        const li = document.createElement('li');
        li.innerHTML = `<span>${playerName}</span> <span>🏆 Rank ${finishedPlayers.size}</span>`;
        leaderboardList.appendChild(li);

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Congratulations, ${playerName} has a full house!`);
            window.speechSynthesis.speak(utterance);
        }
    }

    // Auto Draw Logic
    function toggleAutoDraw() {
        if (autoDrawInterval) {
            stopAutoDraw();
        } else {
            startAutoDraw();
        }
    }

    function startAutoDraw() {
        if (drawnNumbers.size >= totalNumbers) return;
        const speed = parseInt(autoDrawSpeed.value, 10);
        autoDrawBtn.textContent = 'Auto Draw: On';
        autoDrawBtn.classList.replace('secondary-btn', 'primary-btn');
        autoDrawInterval = setInterval(() => {
            if (drawnNumbers.size >= totalNumbers) {
                stopAutoDraw();
            } else {
                drawNumber();
            }
        }, speed);
    }

    function stopAutoDraw() {
        if (autoDrawInterval) {
            clearInterval(autoDrawInterval);
            autoDrawInterval = null;
        }
        autoDrawBtn.textContent = 'Auto Draw: Off';
        autoDrawBtn.classList.replace('primary-btn', 'secondary-btn');
    }

    // Ticket Generation Logic
    function getColumnRange(colIndex) {
        if (colIndex === 0) return { min: 1, max: 9 };
        if (colIndex === 8) return { min: 80, max: 90 };
        return { min: colIndex * 10, max: colIndex * 10 + 9 };
    }

    function getRandomFromRange(min, max, exclude = []) {
        let num;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (exclude.includes(num));
        return num;
    }

    function generateTickets() {
        ticketContainer.innerHTML = '';
        let count = parseInt(playerCountInput.value, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 20) count = 20;

        for (let i = 0; i < count; i++) {
            const ticketData = generateSingleTicketData();
            renderTicket(ticketData, i + 1);
        }
    }

    function generateSingleTicketData() {
        const ticket = Array(3).fill(null).map(() => Array(9).fill(null));
        const columnCounts = Array(9).fill(0);

        // For each row, pick 5 random columns
        for (let r = 0; r < 3; r++) {
            let cols = [];
            while (cols.length < 5) {
                let c = Math.floor(Math.random() * 9);
                // Simple balancing to try avoiding completely empty columns or too packed ones
                if (!cols.includes(c) && columnCounts[c] < 3) {
                    cols.push(c);
                    columnCounts[c]++;
                }
            }
            cols.forEach(c => ticket[r][c] = true);
        }

        // Fill columns with actual sorted numbers
        for (let c = 0; c < 9; c++) {
            let { min, max } = getColumnRange(c);
            let numsToPick = columnCounts[c];
            let pickedNums = [];
            
            for (let i = 0; i < numsToPick; i++) {
                let num = getRandomFromRange(min, max, pickedNums);
                pickedNums.push(num);
            }
            pickedNums.sort((a, b) => a - b);

            let pickedIdx = 0;
            for (let r = 0; r < 3; r++) {
                if (ticket[r][c] === true) {
                    ticket[r][c] = pickedNums[pickedIdx++];
                }
            }
        }

        return ticket;
    }

    function renderTicket(ticketData, playerNum) {
        const wrapper = document.createElement('div');
        wrapper.dataset.player = playerNum;
        wrapper.innerHTML = `<input type="text" class="player-name-input" value="Player ${playerNum}" title="Click to edit name" />`;
        
        const ticketDiv = document.createElement('div');
        ticketDiv.classList.add('ticket');

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('ticket-cell');
                if (ticketData[r][c] === null) {
                    cell.classList.add('empty');
                } else {
                    cell.textContent = ticketData[r][c];
                    // If already drawn in current game, mark it
                    if (drawnNumbers.has(ticketData[r][c])) {
                        cell.classList.add('marked');
                    }
                }
                // Allow manual marking/unmarking for player
                cell.addEventListener('click', () => {
                    if (!cell.classList.contains('empty')) {
                        cell.classList.toggle('marked');
                        checkWinners();
                    }
                });
                ticketDiv.appendChild(cell);
            }
        }
        wrapper.appendChild(ticketDiv);
        ticketContainer.appendChild(wrapper);
    }

    // Event Listeners
    drawBtn.addEventListener('click', drawNumber);
    resetBtn.addEventListener('click', resetGame);
    generateTicketBtn.addEventListener('click', generateTickets);
    autoDrawBtn.addEventListener('click', toggleAutoDraw);
    autoDrawSpeed.addEventListener('change', () => {
        if (autoDrawInterval) {
            stopAutoDraw();
            startAutoDraw();
        }
    });
    playerCountInput.addEventListener('change', generateTickets);
    playerCountInput.addEventListener('input', generateTickets);

    // Init
    initBoard();
    generateTickets(); // Generate tickets by default
});
