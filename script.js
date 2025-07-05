const playerGrid = document.getElementById('playerGrid');
const enemyGrid = document.getElementById('enemyGrid');
const gridSize = 10;


function createGrid(field) {
    for (let i = 1; i <= gridSize * gridSize; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        // console.log(`Индекс № ${i}`)
        field.appendChild(cell);
    }
}