document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const enemyGrid = document.getElementById('enemy-grid');
    const ships = document.querySelectorAll('.ship');
    const CELL_SIZE = 40;
    const GRID_SIZE = 10;

    let gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    let enemyBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    let playerBoard = gameBoard;
    let aiShots = [];
    let isPlayerTurn = true;
    let playerShipCells = 0;
    let enemyShipCells = 0;
    let playerHits = 0;
    let enemyHits = 0;

    // ген поля гравця
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.dataset.row = Math.floor(i / GRID_SIZE);
        cell.dataset.col = i % GRID_SIZE;
        gridContainer.appendChild(cell);
    }

    // поле противника
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        enemyGrid.appendChild(cell);
    }

    // оберти корабля
    ships.forEach(ship => {
        ship.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!ship.classList.contains('placed')) {
                ship.classList.toggle('vertical');
            }
        });
    });

    // drag & drop
    ships.forEach(ship => {
        ship.addEventListener('dragstart', (e) => {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.id);
        });
        ship.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });

    document.querySelectorAll('#grid-container .grid-cell').forEach(cell => {
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            highlightCells(e.target, true);
        });

        cell.addEventListener('dragleave', (e) => {
            highlightCells(e.target, false);
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            highlightCells(e.target, false);

            const shipId = e.dataTransfer.getData('text/plain');
            const draggedShip = document.getElementById(shipId);

            if (draggedShip.classList.contains('placed')) return;

            const length = parseInt(draggedShip.dataset.length);
            const isVertical = draggedShip.classList.contains('vertical');
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);

            if (canPlaceShip(row, col, length, isVertical)) {
                placeShip(draggedShip, row, col, length, isVertical);
            }
        });
    });
//проверка на пересечение
    function canPlaceShip(row, col, length, isVertical) {
        if (isVertical) {
            if (row + length > GRID_SIZE) return false;
        } else {
            if (col + length > GRID_SIZE) return false;
        }

        for (let i = 0; i < length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;

            if (gameBoard[r][c] === 1) return false;

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                        if (gameBoard[nr][nc] === 1) return false;
                    }
                }
            }
        }

        return true;
    }

    function placeShip(ship, row, col, length, isVertical) {
        ship.style.top = `${row * CELL_SIZE}px`;
        ship.style.left = `${col * CELL_SIZE}px`;
        gridContainer.appendChild(ship);
        ship.classList.add('placed');
        ship.draggable = false;

        for (let i = 0; i < length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;
            gameBoard[r][c] = 1;
            playerShipCells++;
        }

        checkAllShipsPlaced();
    }

    function checkAllShipsPlaced() {
        const unplaced = document.querySelectorAll('.ship:not(.placed)');
        const shipsPalette = document.querySelector('.ships-palette'); // Находим контейнер кораблей

        if (unplaced.length === 0) {
            document.getElementById('start-button').disabled = false;
            if (shipsPalette) {
                shipsPalette.style.padding = '0';
                shipsPalette.style.height = '0';
                shipsPalette.style.width = '0';
                shipsPalette.style.opacity = '0';
            }
        } else {
            document.getElementById('start-button').disabled = true;
        }
    }

    function highlightCells(targetCell, isAdding) {
        const draggedShip = document.querySelector('.dragging');
        if (!draggedShip) return;

        const length = parseInt(draggedShip.dataset.length);
        const isVertical = draggedShip.classList.contains('vertical');
        const row = parseInt(targetCell.dataset.row);
        const col = parseInt(targetCell.dataset.col);

        const valid = canPlaceShip(row, col, length, isVertical);

        for (let i = 0; i < length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;
            const cell = gridContainer.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                if (isAdding) {
                    cell.classList.add(valid ? 'drag-over' : 'invalid');
                } else {
                    cell.classList.remove('drag-over', 'invalid');
                }
            }
        }
    }

    // авто-расстановка
    document.getElementById('auto-place-button').addEventListener('click', () => {
        resetPlayerBoard();
        autoPlacePlayerShips();
        checkAllShipsPlaced();
    });

    function resetPlayerBoard() {
        gameBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
        playerBoard = gameBoard;
        playerShipCells = 0;

        const shipsPalette = document.querySelector('.ships-palette');

        if (shipsPalette) {
            shipsPalette.style.height = '';
            shipsPalette.style.width = '';
            shipsPalette.style.padding = '';
            shipsPalette.style.border = '';
        }

        document.querySelectorAll('.ship').forEach(ship => {
            ship.classList.remove('placed', 'vertical');
            ship.style.top = '';
            ship.style.left = '';
            ship.draggable = true;
            ship.style.pointerEvents = '';
            document.querySelector('.ships-palette').appendChild(ship);
        });

        document.querySelectorAll('#grid-container .grid-cell').forEach(cell => {
            cell.classList.remove('drag-over', 'invalid', 'ai-hit', 'ai-miss');
        });

        checkAllShipsPlaced();
    }

    function autoPlacePlayerShips() {
        const shipsToPlace = [
            {length: 4, ids: ['ship_4_1']},
            {length: 3, ids: ['ship_3_1', 'ship_3_2']},
            {length: 2, ids: ['ship_2_1', 'ship_2_2', 'ship_2_3']},
            {length: 1, ids: ['ship_1_1', 'ship_1_2', 'ship_1_3', 'ship_1_4']},
        ];

        for (const shipGroup of shipsToPlace) {
            for (const id of shipGroup.ids) {
                const ship = document.getElementById(id);
                let placed = false;

                while (!placed) {
                    const isVertical = Math.random() < 0.5;
                    const row = Math.floor(Math.random() * GRID_SIZE);
                    const col = Math.floor(Math.random() * GRID_SIZE);

                    if (canPlaceShip(row, col, shipGroup.length, isVertical)) {
                        placeShip(ship, row, col, shipGroup.length, isVertical);
                        ship.classList.toggle('vertical', isVertical);
                        placed = true;
                    }
                }
            }
        }
    }

    //
    const enemyShipsToPlace = [
        {length: 4, count: 1},
        {length: 3, count: 2},
        {length: 2, count: 3},
        {length: 1, count: 4}
    ];

    function placeEnemyShips() {
        for (const ship of enemyShipsToPlace) {
            let placed = 0;
            while (placed < ship.count) {
                const isVertical = Math.random() < 0.5;
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);

                if (canPlaceShipEnemy(row, col, ship.length, isVertical)) {
                    for (let i = 0; i < ship.length; i++) {
                        const r = isVertical ? row + i : row;
                        const c = isVertical ? col : col + i;
                        enemyBoard[r][c] = 1;
                        enemyShipCells++;
                        const idx = r * GRID_SIZE + c;
                        enemyGrid.children[idx].classList.add('enemy-ship-cell'); // убрать потом
                    }
                    placed++;
                }
            }
        }
    }

    function canPlaceShipEnemy(row, col, length, isVertical) {
        if (isVertical && row + length > GRID_SIZE) return false;
        if (!isVertical && col + length > GRID_SIZE) return false;

        for (let i = 0; i < length; i++) {
            const r = isVertical ? row + i : row;
            const c = isVertical ? col : col + i;
            if (enemyBoard[r][c] === 1) return false;

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                        if (enemyBoard[nr][nc] === 1) return false;
                    }
                }
            }
        }
        return true;
    }

    function checkVictory() {
        if (playerHits === enemyShipCells) {
            alert(' Win!');
            enemyGrid.style.pointerEvents = 'none';
        } else if (enemyHits === playerShipCells) {
            alert(' Loose!');
            enemyGrid.style.pointerEvents = 'none';
        }
    }

    function aiMove() {
        let row, col;
        do {
            row = Math.floor(Math.random() * GRID_SIZE);
            col = Math.floor(Math.random() * GRID_SIZE);
        } while (aiShots.some(shot => shot.row === row && shot.col === col));

        aiShots.push({row, col});
        const index  = row * GRID_SIZE + col;
        const cell = gridContainer.children[index];

        if (playerBoard[row][col] === 1) {
            cell.classList.add('ai-hit');
            enemyHits++;
            checkVictory();
        } else {
            cell.classList.add('ai-miss');
        }
    }

    enemyGrid.addEventListener('click', (e) => {
        if (!isPlayerTurn) return;
        const cell = e.target;
        if (!cell.classList.contains('grid-cell')) return;
        const index = Array.from(enemyGrid.children).indexOf(cell);
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;

        if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

        if (enemyBoard[row][col] === 1) {
            cell.classList.add('hit');
            playerHits++;
            checkVictory();
        } else {
            cell.classList.add('miss');
        }

        isPlayerTurn = false;
        setTimeout(() => {
            aiMove();
            isPlayerTurn = true;
        }, 600);
    });

    document.getElementById('start-button').addEventListener('click', () => {
        document.querySelectorAll('.ship').forEach(ship => {
            ship.draggable = false;
            ship.style.pointerEvents = 'none';
        });

        document.querySelectorAll('#grid-container .grid-cell').forEach(cell => {
            cell.replaceWith(cell.cloneNode(true));
        });

        // alert('Game Started!');
        placeEnemyShips();
        enemyGrid.style.pointerEvents = 'auto';
    });


});