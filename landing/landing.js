// MOCK WALLET CONNECT
document.getElementById("connect-wallet").onclick = function () {
    this.innerText = "0x71C...4f2E";
    this.style.background = "#22c55e";
};

// ENTER GAME
function enterGame() {
    // ileride token / auth kontrol buraya
    localStorage.setItem("canPlay", "true");
    window.location.href = "../game/game.html";
}
