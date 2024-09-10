class BoardSquare {
    constructor(hasBomb = false, bombsAround = 0) {
        this.hasBomb = hasBomb;
        this.bombsAround = bombsAround;
    }
}

let difficulty = {
    easy: { rowCount: 9, colCount: 9, bombProbability: 3, maxProbability: 15 },
    medium: { rowCount: 12, colCount: 12, bombProbability: 5, maxProbability: 20 },
    expert: { rowCount: 15, colCount: 15, bombProbability: 7, maxProbability: 30 }
};

let currentdifficulty = difficulty.easy;
let board = [];
let gameOver = false;
let init = false;

document.addEventListener('DOMContentLoaded', onLoad);

function onLoad() {
    const difficultySelect = document.getElementById('difficulty');
    const bombProbabilityInput = document.getElementById('bombProbability');
    const maxProbabilityInput = document.getElementById('maxProbability');
    const game = document.getElementById('game');
    const btnStart = document.getElementById('btnStart');
    const btnReset = document.getElementById('btnReset');

    updateInputs();

    difficultySelect.addEventListener('change', (e) => {
        currentdifficulty = difficulty[e.target.value];
        updateInputs();
    });

    bombProbabilityInput.addEventListener('input', (e) => {
        currentdifficulty.bombProbability = Number(e.target.value);
    });

    maxProbabilityInput.addEventListener('input', (e) => {
        currentdifficulty.maxProbability = Number(e.target.value);
    });

    btnStart.addEventListener('click', onStart);
    btnReset.addEventListener('click', onReset);
    game.addEventListener('click', onClick);
    game.addEventListener('contextmenu', onRightClick);
}

function updateInputs() {
    document.getElementById('bombProbability').value = currentdifficulty.bombProbability;
    document.getElementById('maxProbability').value = currentdifficulty.maxProbability;
}

function onStart() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    gameOver = false;
    init = false;
    document.getElementById('btnReset').disabled = false;
    generateBoard();
}

function onReset() {
    const game = document.getElementById('game');
    game.innerHTML = '';
    gameOver = false;
    init = false;
    document.getElementById('btnReset').disabled = true;
}



function generateBoard() {
    board = [];
    const game = document.getElementById('game');

    game.style.gridTemplateColumns = `repeat(${currentdifficulty.colCount}, 30px)`;
    game.style.gridTemplateRows = `repeat(${currentdifficulty.rowCount}, 30px)`;

    for (let i = 0; i < currentdifficulty.rowCount; i++) {
        board.push([]);
        for (let j = 0; j < currentdifficulty.colCount; j++) {
            const div = document.createElement('div');
            div.x = j;
            div.y = i;
            div.style.top = `${i * 30}px`;
            div.style.left = `${j * 30}px`;
            div.boardSquare = new BoardSquare();
            div.flagged = false;
            board[i][j] = div;
            game.appendChild(div);
        }
    }
}



function onClick(e) {
    let target = e.target.closest('div');
    if (!target || gameOver || target.classList.contains('show') || target.flagged) return;

    //generarea minelor la primul clic
    if (!init) {
        generateMines(target.x, target.y);
        init = true;
    }

    if (target.boardSquare.hasBomb) {
        revealBombs();
        setTimeout(() => {
            Swal.fire({
                title: 'Game Over!',
                text: 'You hit a bomb!',
                icon: 'error',
                confirmButtonText: 'Try Again!',
                background: '#fff1f6'
            });
            gameOver = true;
            onReset();
        }, 800);
    } else {
        target.textContent = target.boardSquare.bombsAround || '';
        target.classList.add('show');
        if (target.boardSquare.bombsAround === 0) showAll(target);
    }
}


function onRightClick(e) {
    e.preventDefault();
    let target = e.target.closest('div');
    if (!target || gameOver || target.classList.contains('show')) return;

    target.flagged = !target.flagged;
    if (target.flagged) {
        target.innerHTML = '<img src="./images/flag.jpg">';
    } else {
        target.innerHTML = '';
    }

    const allFlags = Array.from(document.querySelectorAll('#game div')).filter(d => d.flagged);
    //cu acest if verific daca numarul de steaguri plasate nu depaseste numarul maxim posibil de bombe (nu se poate castiga daca am pus mai multe steaguri decat numarul maxim posibil de bombe)
    if (allFlags.length <= currentdifficulty.maxProbability) {

        const allBombsMarkedAndNoFalseFlags = board.flat().every(cell =>
            !cell.boardSquare.hasBomb ? !cell.flagged : cell.flagged
        );
        // conditia allBombsMarkedAndNoFalseFlags asigura ca:
        // 1. nici o celula fara bomba nu este marcata cu steag
        // 2. toate celulele cu bomba sunt corect marcate cu steag

        if (allBombsMarkedAndNoFalseFlags) {
            setTimeout(() => {
                Swal.fire({
                    title: 'Congratulations!',
                    text: 'You won the game!',
                    icon: 'success',
                    confirmButtonText: 'Awesome!',
                    background: '#fff1f6'
                });
                gameOver = true;
                onReset();
            }, 800);
        }
    }
}



function revealBombs() {
    board.flat().forEach(cell => {
        if (cell.boardSquare.hasBomb) {
            cell.innerHTML = '<img src="./images/bomb.jpg" alt="Bomb">';
        }
    });
}



function generateMines(excludeX, excludeY) {
    const cells = board.flat();
    const totalCells = currentdifficulty.rowCount * currentdifficulty.colCount;
    let totalBombs = 0;


    cells.forEach(cell => cell.boardSquare.hasBomb = false);

    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!(cell.x === excludeX && cell.y === excludeY) &&
            Math.random() * currentdifficulty.maxProbability < currentdifficulty.bombProbability) {
            cell.boardSquare.hasBomb = true;
            totalBombs++;
        }
        if (totalBombs >= currentdifficulty.maxProbability) {
            break;
        }
    }

    generateNeighbours();
}


//generateNeighbours calculeaza cate bombe exista in jurul fiecarei celule
function generateNeighbours() {
    board.flat().forEach(cell => {
        if (cell.boardSquare.hasBomb) {

            const directions = [
                { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 },
                { x: 0, y: -1 },  { x: 0, y: 1 },
                { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }
            ];

            directions.forEach(dir => {
                const newX = cell.x + dir.x;
                const newY = cell.y + dir.y;

                if (newX >= 0 && newX < currentdifficulty.colCount && newY >= 0 && newY < currentdifficulty.rowCount) {
                    const neighbour = board[newY][newX];
                    if (!neighbour.boardSquare.hasBomb) {
                        neighbour.boardSquare.bombsAround = (neighbour.boardSquare.bombsAround || 0) + 1;
                    }
                }
            });
        }
    });
}



//showAll este folosita pentru a dezvalui toate celulele din jurul unei celule specificate, pana cand intalneste celule care contin bombe sau celule care au deja o numaratoare a bombelor
function showAll(target) {
    const x = target.x, y = target.y;
    target.textContent = target.boardSquare.bombsAround || '';
    target.classList.add('show');
    if (target.boardSquare.bombsAround) return;

    const neighbors = Array.from(document.querySelectorAll('#game div')).filter(c =>
        c.x >= x - 1 && c.x <= x + 1 && c.y >= y - 1 && c.y <= y + 1 &&
        c !== target && !c.classList.contains('show')
    );

    neighbors.forEach(showAll);
}








