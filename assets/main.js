import MineSweeper from "./app.js";

const form = document.querySelector("#menu");

function validateNickName(nickName) {
    return /^[a-zA-Z0-9]+$/.test(nickName) && nickName.length >= 2;
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cellSize = 30; // in px
    const nickNameField = document.querySelector("#nickName");
    const nickName = nickNameField.value.trim().toLowerCase();

    if (!validateNickName(nickName)) {
        alert("please enter a valid name");
        nickNameField.value = "";
        nickNameField.focus();
        return;
    }

    const fields = {
        appElement: document.querySelector("#app"),
        nickName: nickName,
        gameMode: document.querySelector("gameMode"),
    };

    form.style.display = "none";

    new MineSweeper(fields, cellSize);
});
