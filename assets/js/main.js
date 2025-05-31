import MineSweeper from "./app.js";

const header = document.querySelector("h1");
const form = document.querySelector("#menu");
const cellSize = 2; // in rem

function validateNickName(nickName) {
    return /^[a-zA-Z0-9]+$/.test(nickName) && nickName.length >= 2;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nickNameField = document.querySelector("#nickName");
    const nickName = nickNameField.value.trim().toLowerCase();
    const appElement = document.querySelector("#grid");
    const gameMode = document.querySelector("#gameMode").value;

    if (!validateNickName(nickName)) {
        alert("please enter a valid name");
        nickNameField.value = "";
        nickNameField.focus();
        return;
    }

    header.classList.add("hidden");
    form.classList.add("hidden");

    new MineSweeper(appElement, nickName, gameMode, cellSize);
});
