const socket = io();

let playerSymbol = '';
let opponent = '';
let playerName = localStorage.getItem('playerName') || '';
let isMyTurn = false;

// Check if name is set, else ask for it
if (!playerName) {
    playerName = prompt("Enter your name:");
    if (playerName.trim() !== '') {
        localStorage.setItem('playerName', playerName);
    }
}

document.getElementById('joinGameBtn').addEventListener('click', () => {
    socket.emit('joinGame', playerName);
    document.getElementById('joinGameBtn').style.display = 'none';
    document.getElementById('status').innerText = "Waiting for an opponent...";
});

socket.on('startGame', (data) => {
    playerSymbol = data.symbol;
    opponent = data.opponent;
    isMyTurn = playerSymbol === 'X';
    document.getElementById('status').innerText = 
        `You are ${playerSymbol}. ${isMyTurn ? "Your turn!" : "Opponent's turn..."}`;
});

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => {
        if (isMyTurn && cell.innerText === '') {
            cell.innerText = playerSymbol;
            cell.classList.add('played');
            isMyTurn = false;
            socket.emit('move', {
                index: cell.getAttribute('data-index'),
                symbol: playerSymbol,
                opponent: opponent
            });
            document.getElementById('status').innerText = "Waiting for opponent's move...";
            checkWin();
        }
    });
});

socket.on('move', (data) => {
    const cell = document.querySelector(`.cell[data-index='${data.index}']`);
    if (cell.innerText === '') {
        cell.innerText = data.symbol;
        cell.classList.add('played');
        isMyTurn = true;
        document.getElementById('status').innerText = "Your turn!";
        checkWin();
    }
});

function checkWin() {
    const cells = document.querySelectorAll('.cell');
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (cells[a].innerText !== '' && 
            cells[a].innerText === cells[b].innerText && 
            cells[a].innerText === cells[c].innerText) {
            document.getElementById('status').innerText = 
                cells[a].innerText === playerSymbol ? 
                `Congratulations, ${playerName}! You won!` : 
                `Sorry, ${playerName}. You lost.`;
            combination.forEach(index => cells[index].classList.add('winning'));
            document.getElementById('restartBtn').style.display = 'inline-block';
            return;
        }
    }

    if ([...cells].every(cell => cell.innerText !== '')) {
        document.getElementById('status').innerText = "It's a draw!";
        document.getElementById('restartBtn').style.display = 'inline-block';
    }
}

document.getElementById('restartBtn').addEventListener('click', () => {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('played', 'winning');
    });
    socket.emit('restart', opponent);
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('status').innerText = "Waiting for opponent's move...";
});
