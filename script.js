document.addEventListener('DOMContentLoaded', () => {
    const boardContainer = document.getElementById('tambola-board');
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const currentNumberDisplay = document.getElementById('current-number');
    const generateTicketBtn = document.getElementById('generate-ticket-btn');
    const ticketContainer = document.getElementById('ticket-container');

    let drawnNumbers = new Set();
    const totalNumbers = 90;

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
        ticketContainer.innerHTML = ''; // Clear generated ticket
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

    function generateTicket() {
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

        renderTicket(ticket);
    }

    function renderTicket(ticketData) {
        ticketContainer.innerHTML = '';
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
                    }
                });
                ticketDiv.appendChild(cell);
            }
        }
        ticketContainer.appendChild(ticketDiv);
    }

    // Event Listeners
    drawBtn.addEventListener('click', drawNumber);
    resetBtn.addEventListener('click', resetGame);
    generateTicketBtn.addEventListener('click', generateTicket);

    // Init
    initBoard();
    generateTicket(); // Generate one ticket by default
});
