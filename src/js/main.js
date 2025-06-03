import MineSweeper from "./app.js";

let gameInstance;
const nickNameField = document.querySelector("#nickName");
const fields = {
    bgVideo: document.querySelector("#bg-video"),
    gridContainer: document.querySelector("#grid"),
    header: document.querySelector("h1"),
    menu: document.querySelector("#menu"),
    gameOver: document.querySelector("#game-over"),
    gameMode: document.querySelector("#game-mode"),
    footer: document.querySelector("footer"),
    banner: document.querySelector("h2"),
};
const data = {
    gameMode: "",
    nickName: "",
    // cellSize: 1.8, // in rem
    winVideo: "./src/assets/explosion.mp4",
    loseVideo: "./src/assets/atomic-bomb.mp4",
};

fields.menu.addEventListener("submit", (e) => {
    e.preventDefault();

    // cancel ongoing async tasks and event handlers in the background
    if (gameInstance) {
        gameInstance.abortTasks();
        gameInstance = null;
    }

    const nickName = nickNameField.value.trim().toLowerCase();

    if (!validateNickName(nickName)) {
        alert("please enter a valid name");
        nickNameField.value = "";
        nickNameField.focus();
        return;
    }

    data.nickName = nickName;
    data.gameMode = fields.gameMode.value;

    // hide header, menu and grid, reset nickname
    fields.header.classList.add("hidden");
    fields.menu.classList.add("hidden");
    fields.footer.classList.add("hidden");
    fields.gridContainer.classList.remove("hidden");
    nickNameField.value = "";

    gameInstance = new MineSweeper(fields, data);
});

// Play background video
document.addEventListener("DOMContentLoaded", () => {
    fields.bgVideo.setAttribute("src", data.winVideo);
    fields.bgVideo.currentTime = 0;
});

// Remove background video after finished
fields.bgVideo.addEventListener("ended", () => {
    fields.bgVideo.removeAttribute("src");
    fields.bgVideo.classList.add("hidden");
    // document.body.style.animation = "blackOut 4s ease forwards";
});

function validateNickName(nickName) {
    return /^[a-zA-Z0-9]+$/.test(nickName) && nickName.length >= 2;
}
