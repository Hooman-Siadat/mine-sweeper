class MineSweeper {
    constructor(fields, data) {
        this.abortController = new AbortController();
        this.isGameOver = false;
        this.firstClick = true;
        this.grid = [];
        this.minCellSize = 48; //in px
        this.gridDimension = {
            rows: Math.floor(window.innerHeight / this.minCellSize),
            cols: Math.floor(window.innerWidth / this.minCellSize),
        };
        this.totalCells = this.gridDimension.rows * this.gridDimension.cols;
        this.cellSize = this.getResponsiveCellSize(this.gridDimension.rows, this.gridDimension.cols);
        this.emptyCells = [];
        this.revealedCells = 0;
        this.fields = fields;
        this.data = data;
        this.mineExplosionDelay = 20; // in ms
        this.restartDelay = 3000; // in ms
        this.VALUE = {
            FALSE: 0,
            TRUE: 1,
        };
        // defines percentage of mines
        this.GAME_MODE = {
            EASY: Math.floor(0.1 * this.totalCells),
            MEDIUM: Math.floor(0.2 * this.totalCells),
            HARD: Math.floor(0.3 * this.totalCells),
            VERY_HARD: Math.floor(0.4 * this.totalCells),
            INSANE: Math.floor(0.5 * this.totalCells),
            EXTREME: Math.floor(0.6 * this.totalCells),
        };
        this.totalMines = Object.values(this.GAME_MODE)[this.data.gameMode];
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

    getResponsiveCellSize(rows, cols) {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        const minWidth = 48;

        const cellSizeByWidth = (maxWidth / cols) * 0.95;
        const cellSizeByHeight = (maxHeight / rows) * 0.95;

        return Math.min(minWidth, cellSizeByWidth, cellSizeByHeight);
    }

    initiate() {
        this.playVideo(true);
        // generateGrid
        this.generateGrid(this.gridDimension);
        // drawGrid
        const cells = this.generateCellElements();
        // render
        this.drawGrid(cells);
        // handle events
        this.handleEvents();
    }

    generateGrid(gridDimension) {
        // create a matrix of cell objects cols * rows
        this.grid = Array.from({ length: gridDimension.rows }, (_, r) =>
            Array.from({ length: gridDimension.cols }, (_, c) => ({
                col: c,
                row: r,
                isMine: this.VALUE.FALSE,
                isRevealed: this.VALUE.FALSE,
                isFlagged: this.VALUE.FALSE,
                adjacentMineCount: 0,
            }))
        );
    }

    placeMinesExcluding(safeRow, safeCol, totalMines) {
        const excluded = new Set();
        // excluded the 3x3 block around the first click
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const row = safeRow + r;
                const col = safeCol + c;
                if (row >= 0 && row < this.gridDimension.rows && col >= 0 && col < this.gridDimension.cols) {
                    excluded.add(`${row},${col}`);
                }
            }
        }

        // place mines in the grid except the excluded cells
        let placedMine = 0;
        while (placedMine < totalMines) {
            const row = Math.floor(Math.random() * this.gridDimension.rows);
            const col = Math.floor(Math.random() * this.gridDimension.cols);
            const key = `${row},${col}`;

            if (!excluded.has(key) && !this.grid[row][col].isMine) {
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
        const cols = this.gridDimension.cols;
        const rows = this.gridDimension.rows;

        // set grid configuration
        this.fields.gridContainer.style.gridTemplate = `repeat(${rows}, ${this.cellSize}px) / repeat(${cols}, ${this.cellSize}px)`;
        // receives the drawn grid and renders it in document
        for (const cell of cells) {
            this.fields.gridContainer.append(cell);
        }
    }

    clearGrid() {
        this.fields.gridContainer.innerHTML = "";
        this.fields.gridContainer.style = "";
        // this.fields.gridContainer.classList.add("hidden");
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
        if (e.target.nodeName === "DIV" && e.target.classList.contains("cell")) {
            const firstClickRow = +e.target.dataset.row;
            const firstClickCol = +e.target.dataset.col;

            if (this.firstClick) {
                this.firstClick = false;
                this.ensureFirstClickSafe(firstClickRow, firstClickCol);
            }

            this.revealCell(e.target);
        }
    };

    ensureFirstClickSafe(firstClickRow, firstClickCol) {
        // Clear existing grid and mines
        this.generateGrid(this.gridDimension);

        this.clearMines();
        this.placeMinesExcluding(firstClickRow, firstClickCol, this.totalMines);
        this.countAdjacentMines();

        // generate new cell elements, clear existing grid and draw the new grid
        const cells = this.generateCellElements();
        this.clearGrid();
        this.drawGrid(cells);
    }

    clearMines() {
        for (let row of this.grid) {
            for (let cell of row) {
                cell.isMine = this.VALUE.FALSE;
                cell.adjacentMineCount = 0;
            }
        }
    }

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
        let signal = this.abortController.signal;
        // Skip if game is over, flagged, already revealed, aborted, or processed before
        if (
            signal.aborted ||
            this.isGameOver ||
            +targetCell.dataset.isFlagged ||
            +targetCell.dataset.isRevealed ||
            this.emptyCells.includes(targetCell)
        )
            return;

        const isMine = +targetCell.dataset.isMine;
        const adjacentMineCount = +targetCell.dataset.adjacentMineCount;

        // Game over if it's a mine
        if (isMine) {
            targetCell.classList.add("explode");
            this.gameIsOver(false);
            return;
        }

        // Reveal the current cell
        targetCell.dataset.isRevealed = this.VALUE.TRUE;
        this.revealedCells++;

        if (adjacentMineCount === 0) {
            targetCell.classList.add("clear");
            this.emptyCells.push(targetCell);

            // Recursively reveal all neighbors
            for (let [dx, dy] of this.adjacentCellsDirections) {
                const adjacentCol = +targetCell.dataset.col + dx;
                const adjacentRow = +targetCell.dataset.row + dy;

                if (
                    adjacentCol >= 0 &&
                    adjacentCol < this.gridDimension.cols &&
                    adjacentRow >= 0 &&
                    adjacentRow < this.gridDimension.rows
                ) {
                    const adjacentCell = document.querySelector(
                        `[data-col="${adjacentCol}"][data-row="${adjacentRow}"]`
                    );
                    this.revealCell(adjacentCell);
                }
            }
        } else {
            targetCell.classList.add("defused");
            targetCell.textContent = adjacentMineCount;
        }

        // ✅ Always check victory after revealing any cell
        this.checkVictoryCondition();
    }

    async checkVictoryCondition() {
        if (this.revealedCells === this.totalCells - this.totalMines) {
            this.gameIsOver(true);
        }
    }

    async gameIsOver(hasWon) {
        this.abortTasks();

        if (hasWon) {
            this.isGameOver = true;
            this.clearGrid();
            this.playVideo(true);
            this.fields.banner.textContent = "You Won!";
        } else {
            this.playVideo(false);
            this.fields.banner.textContent = "You Lost!";
            await this.revealMines();
            this.isGameOver = true;
            this.clearGrid();
        }

        this.fields.banner.classList.remove("hidden");
        await this.delay(this.restartDelay);
        this.resetGame();
    }

    revealSurrounding(targetCell) {
        if (+targetCell.dataset.isRevealed && +targetCell.dataset.adjacentMineCount !== 0) {
            let flaggedCellCount = 0;
            for (let [col, row] of this.adjacentCellsDirections) {
                const adjacentCol = +targetCell.dataset.col + col;
                const adjacentRow = +targetCell.dataset.row + row;
                if (
                    adjacentCol >= 0 &&
                    adjacentCol < this.gridDimension.cols &&
                    adjacentRow >= 0 &&
                    adjacentRow < this.gridDimension.rows
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
                        adjacentCol < this.gridDimension.cols &&
                        adjacentRow >= 0 &&
                        adjacentRow < this.gridDimension.rows
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
        }
    }

    delay(ms, signal = this.abortController.signal) {
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                return reject(new DOMException("Aborted", "AbortError"));
            }

            const timeoutId = setTimeout(resolve, ms);

            signal?.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                reject(new DOMException("Aborted", "AbortError"));
            });
        });
    }

    abortTasks() {
        this.abortController.abort(); // stop all current tasks
        this.abortController = new AbortController(); // reset for next time
    }

    toggleFlag(targetCell) {
        if (+targetCell.dataset.isRevealed) return;

        if (+targetCell.dataset.isFlagged) {
            targetCell.dataset.isFlagged = this.VALUE.FALSE;
            targetCell.classList.remove("flagged");
            targetCell.textContent = "";
        } else {
            targetCell.dataset.isFlagged = this.VALUE.TRUE;
            targetCell.innerHTML = "&#128681";
            targetCell.classList.add("flagged");
        }
    }

    resetGame() {
        this.fields.banner.classList.add("hidden");
        this.fields.gridContainer.classList.add("hidden"); //remove
        this.showMenu();
    }

    showMenu() {
        this.fields.header.classList.remove("hidden");
        this.fields.menu.classList.remove("hidden");
        this.fields.footer.classList.remove("hidden");
    }

    playVideo(playerWon) {
        let video = null;

        if (playerWon) {
            video = this.data.winVideo;
        } else {
            video = this.data.loseVideo;
        }

        if (this.fields.bgVideo) {
            this.fields.bgVideo.setAttribute("src", video);
            this.fields.bgVideo.addEventListener(
                "canplaythrough",
                () => {
                    this.fields.bgVideo.style.display = "block";
                    this.fields.bgVideo.currentTime = 0; // Rewind to the beginning
                    this.fields.bgVideo.playbackRate = 2;
                    this.fields.bgVideo.play(); // Start playback
                },
                { once: true, signal: this.abortController.signal }
            );
        }
    }
}

export default MineSweeper;
