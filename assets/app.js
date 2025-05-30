class MineSweeper {
    constructor({ appElement, nickName, selectedGameMode }, cellSize) {
        this.gameOver = false;
        this.grid = [];
        this.cellSize = cellSize;
        this.appElement = appElement;
        this.nickName = nickName.value.trim().toLowerCase();
        this.GAME_MODE = Object.freeze({
            EASY: { rows: 8, cols: 8, mineCount: 10 },
            MEDIUM: { rows: 12, cols: 12, mineCount: 24 },
            HARD: { rows: 16, cols: 16, mineCount: 40 },
            VERY_HARD: { rows: 20, cols: 20, mineCount: 80 },
            INSANE: { rows: 24, cols: 24, mineCount: 120 },
            EXTREME: { rows: 30, cols: 30, mineCount: 200 },
        });
        this.selectedGameMode = Object.values(this.GAME_MODE)[selectedGameMode.value];
        this.adjacentCellsDirections = Object.values({
            NW: [-1, -1],
            N: [0, -1],
            NE: [+1, -1],
            W: [-1, 0],
            E: [+1, 0],
            SW: [-1, +1],
            S: [0, +1],
            SE: [+1, +1],
        });

        this.initiate();
    }

    initiate() {
        // generateGrid
        this.generateGrid(this.selectedGameMode);
        // placeMines on the generatedGrid
        this.placeMines(this.selectedGameMode);
        // countAdjacentMines
        this.countAdjacentMines();
        // drawGrid
        // handle events
        // render the drawn grid
    }

    generateGrid(gameMode) {
        // create a matrix of cell objects cols * rows
        this.grid = Array.from({ length: gameMode.rows }, (_, r) =>
            Array.from({ length: gameMode.cols }, (_, c) => ({
                col: c,
                row: r,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMineCount: 0,
            }))
        );
    }

    placeMines(gameMode) {
        let placedMine = 0;
        while (placedMine <= gameMode.mineCount) {
            const row = Math.floor(Math.random() * gameMode.rows);
            const col = Math.floor(Math.random() * gameMode.cols);
            if (!this.grid[row][col].isMine) {
                this.grid[row][col].isMine = true;
                placedMine++;
            }
        }
    }

    countAdjacentMines() {
        // define the adjacent directions
        // go through each cell and check if the adjacent cells have a mine and count
    }

    handleEvents() {}

    toggleFlag() {
        // prevent default on user right click
        // toggle the following behavior:
        // place a flag icon on the cell
        // set the cell's isFlagged to True
    }

    reveal() {
        // check if the current cell is within boundaries and not gameover
        // if theres a mine gameover
        // if its already revealed return
        // if there is not a mine set the cell as revealed and display adjacentMinesCount
        // if the adjacentMinesCount equals 0 then check all the adjacent cells and repeat this process
    }

    drawGrid() {
        // receives the generated grid and creates and returns the elements
    }

    render() {
        // receives the drawn grid and renders it in document
    }
}

export default MineSweeper;
