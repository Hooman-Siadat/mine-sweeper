class MineSweeper {
    constructor(fields, data) {
        this.abortController = new AbortController();
        this.isGameOver = false;
        this.grid = [];
        this.emptyCells = [];
        this.revealedCells = 0;
        this.fields = fields;
        this.data = data;
        this.mineExplosionDelay = 20; // in ms
        this.restartDelay = 7000; // in ms
        this.VALUE = {
            FALSE: 0,
            TRUE: 1,
        };
        this.GAME_MODE = Object.freeze({
            EASY: { rows: 8, cols: 8, mineCount: 10 }, //10
            MEDIUM: { rows: 12, cols: 12, mineCount: 24 }, //24
            HARD: { rows: 16, cols: 16, mineCount: 40 }, //40
            VERY_HARD: { rows: 20, cols: 20, mineCount: 80 }, //80
            INSANE: { rows: 24, cols: 24, mineCount: 120 }, //120
            EXTREME: { rows: 30, cols: 30, mineCount: 100 }, //200
        });
        this.selectedGameMode = Object.values(this.GAME_MODE)[this.data.gameMode];
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
        const cells = this.generateCellElements();
        // render
        this.drawGrid(cells);
        // handle events
        this.handleEvents();
    }

    generateGrid(gameMode) {
        // create a matrix of cell objects cols * rows
        this.grid = Array.from({ length: gameMode.rows }, (_, r) =>
            Array.from({ length: gameMode.cols }, (_, c) => ({
                col: c,
                row: r,
                isMine: this.VALUE.FALSE,
                isRevealed: this.VALUE.FALSE,
                isFlagged: this.VALUE.FALSE,
                adjacentMineCount: 0,
            }))
        );
    }

    placeMines(gameMode) {
        let placedMine = 0;
        while (placedMine < gameMode.mineCount) {
            const row = Math.floor(Math.random() * gameMode.rows);
            const col = Math.floor(Math.random() * gameMode.cols);
            if (!this.grid[row][col].isMine) {
                this.grid[row][col].isMine = this.VALUE.TRUE;
                placedMine++;
            }
        }
    }

    countAdjacentMines() {
        // go through each cell and check if the adjacent cells have a mine and count
        for (let row of this.grid) {
            for (let cell of row) {
                if (cell.isMine) continue;
                let countedMines = 0;
                for (let [c, r] of this.adjacentCellsDirections) {
                    const adjacentCol = cell.col + c;
                    const adjacentRow = cell.row + r;
                    // make sure cell is within boundaries
                    if (
                        adjacentCol >= 0 &&
                        adjacentCol < row.length &&
                        adjacentRow >= 0 &&
                        adjacentRow < this.grid.length
                    ) {
                        if (this.grid[adjacentRow][adjacentCol].isMine) countedMines++;
                    }
                }
                cell.adjacentMineCount = countedMines;
            }
        }
    }

    generateCellElements() {
        const cells = [];

        for (let row of this.grid) {
            for (let cell of row) {
                const cellElement = document.createElement("div");
                cellElement.dataset.col = cell.col;
                cellElement.dataset.row = cell.row;
                cellElement.dataset.isMine = cell.isMine;
                cellElement.dataset.isRevealed = cell.isRevealed;
                cellElement.dataset.isFlagged = cell.isFlagged;
                cellElement.dataset.adjacentMineCount = cell.adjacentMineCount;
                cellElement.classList.add("cell");

                cells.push(cellElement);
            }
        }

        return cells;
    }

    drawGrid(cells) {
        const cols = this.selectedGameMode.cols;
        const rows = this.selectedGameMode.rows;

        // set grid configuration
        this.fields.gridContainer.style.gridTemplate = `repeat(${cols}, ${this.data.cellSize}rem) / repeat(${rows}, ${this.data.cellSize}rem)`;
        // receives the drawn grid and renders it in document
        for (const cell of cells) {
            this.fields.gridContainer.append(cell);
        }
    }

    clearGrid() {
        this.fields.gridContainer.innerHTML = "";
        this.fields.gridContainer.style = "";
    }

    handleEvents() {
        this.fields.gridContainer.addEventListener("click", this.handleClick, {
            signal: this.abortController.signal,
        });
        this.fields.gridContainer.addEventListener("contextmenu", this.handleRightClick, {
            signal: this.abortController.signal,
        });
        this.fields.gridContainer.addEventListener("dblclick", this.handleDoubleClick, {
            signal: this.abortController.signal,
        });
    }

    handleClick = (e) => {
        // e.stopPropagation();
        if (e.target.nodeName === "DIV" && e.target.classList.contains("cell")) {
            this.revealCell(e.target);
        }
    };

    handleRightClick = (e) => {
        e.preventDefault();
        // e.stopPropagation();
        if (e.target.nodeName === "DIV" && e.target.classList.contains("cell")) {
            this.toggleFlag(e.target);
        }
    };

    handleDoubleClick = (e) => {
        e.preventDefault();
        // e.stopImmediatePropagation();
        if (e.target.nodeName === "DIV" && e.target.classList.contains("cell")) {
            this.revealSurrounding(e.target);
        }
    };

    async revealCell(targetCell) {
        // if is gameover, cell is revealed, is an empty cell
        if (
            this.isGameOver ||
            +targetCell.dataset.isFlagged ||
            +targetCell.dataset.isRevealed ||
            this.emptyCells.includes(targetCell)
        )
            return;

        // if theres a mine gameover
        if (+targetCell.dataset.isMine) {
            targetCell.classList.add("explode");
            this.playVideo(false);
            await this.revealMines();
            this.resetGame();
            // TODO display menu

            return;
        }

        // if no mines in adjacent cells
        if (+targetCell.dataset.adjacentMineCount === 0) {
            this.revealedCells++;
            console.dir(targetCell);
            console.dir(`total: ${this.revealedCells}`);
            // if the adjacentMinesCount equals 0 then check all the adjacent cells and repeat this process
            for (let [c, r] of this.adjacentCellsDirections) {
                const adjacentCol = +targetCell.dataset.col + c;
                const adjacentRow = +targetCell.dataset.row + r;
                // make sure cell is within boundaries
                if (
                    adjacentCol >= 0 &&
                    adjacentCol < this.selectedGameMode.cols &&
                    adjacentRow >= 0 &&
                    adjacentRow < this.selectedGameMode.rows
                ) {
                    const adjacentCell = document.querySelector(
                        `[data-col="${adjacentCol}"][data-row="${adjacentRow}"]`
                    );
                    targetCell.classList.add("clear");
                    targetCell.dataset.isRevealed = this.VALUE.TRUE;

                    this.emptyCells.push(targetCell);
                    this.revealCell(adjacentCell);
                }
            }
        } else {
            // if there is not a mine set the cell as revealed and display adjacentMinesCount
            targetCell.dataset.isRevealed = this.VALUE.TRUE;
            this.revealedCells++;

            console.dir(targetCell);
            console.dir(`total: ${this.revealedCells}`);

            targetCell.classList.add("defused");
            targetCell.textContent = targetCell.dataset.adjacentMineCount;
            this.checkVictoryCondition();
        }
    }

    checkVictoryCondition() {
        const totalCells = this.selectedGameMode.cols * this.selectedGameMode.rows;
        const totalMines = this.selectedGameMode.mineCount;
        if (this.revealedCells === totalCells - totalMines) {
            alert("won the game");
        }
    }

    revealSurrounding(targetCell) {
        if (+targetCell.dataset.isRevealed && +targetCell.dataset.adjacentMineCount !== 0) {
            let flaggedCellCount = 0;
            for (let [col, row] of this.adjacentCellsDirections) {
                const adjacentCol = +targetCell.dataset.col + col;
                const adjacentRow = +targetCell.dataset.row + row;
                if (
                    adjacentCol >= 0 &&
                    adjacentCol < this.selectedGameMode.cols &&
                    adjacentRow >= 0 &&
                    adjacentRow < this.selectedGameMode.rows
                ) {
                    const adjacentCell = document.querySelector(
                        `[data-col="${adjacentCol}"][data-row="${adjacentRow}"]`
                    );
                    if (+adjacentCell.dataset.isFlagged) flaggedCellCount++;
                }
            }

            // reveal adjacent cells
            if (flaggedCellCount === +targetCell.dataset.adjacentMineCount) {
                for (let [col, row] of this.adjacentCellsDirections) {
                    const adjacentCol = +targetCell.dataset.col + col;
                    const adjacentRow = +targetCell.dataset.row + row;
                    if (
                        adjacentCol >= 0 &&
                        adjacentCol < this.selectedGameMode.cols &&
                        adjacentRow >= 0 &&
                        adjacentRow < this.selectedGameMode.rows
                    ) {
                        const adjacentCell = document.querySelector(
                            `[data-col="${adjacentCol}"][data-row="${adjacentRow}"]`
                        );
                        this.revealCell(adjacentCell);
                    }
                }
            }
        }
    }

    async revealMines() {
        const signal = this.abortController.signal;

        const cells = Array.from(document.querySelectorAll(".cell")).filter(
            (cell) => +cell.dataset.isMine && !+cell.dataset.isRevealed
        );

        let index = 0;
        for (let cell of cells) {
            if (signal.aborted) return;

            index++;
            cell.classList.add("explode");
            cell.dataset.isRevealed = this.VALUE.TRUE;
            await this.delay(this.mineExplosionDelay);

            if (index === cells.length - 1) {
                this.isGameOver = true;
            }
        }
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    abortTasks() {
        this.abortController.abort(); // stop all current tasks
        this.abortController = new AbortController(); // reset for next time
    }

    toggleFlag(targetCell) {
        // toggle the following behavior:
        // place a flag icon on the cell
        // set the cell's isFlagged to True
        if (+targetCell.dataset.isRevealed) return;

        if (+targetCell.dataset.isFlagged) {
            targetCell.dataset.isFlagged = this.VALUE.FALSE;
            targetCell.classList.remove("flagged");
            targetCell.textContent = "";
        } else {
            targetCell.dataset.isFlagged = this.VALUE.TRUE;
            targetCell.textContent = "?";
            targetCell.classList.add("flagged");
        }
    }

    resetGame() {
        this.clearGrid();
        this.fields.header.classList.remove("hidden");
        this.fields.menu.classList.remove("hidden");
        this.fields.gridContainer.classList.add("hidden");
    }

    playVideo(playerWon) {
        let video = null;
        let playVideoDelay = 0; //in ms

        if (playerWon) {
            video = this.data.winVideo;
        } else {
            video = this.data.loseVideo;
        }

        // play video with delay
        setTimeout(() => {
            this.fields.bgVideo.setAttribute("src", video);
            this.fields.bgVideo.style.display = "block";
            this.fields.bgVideo.currentTime = 0; // Rewind to the beginning
            this.fields.bgVideo.playbackRate = 2;
            this.fields.bgVideo.play(); // Start playback
        }, playVideoDelay);
    }
}

export default MineSweeper;
