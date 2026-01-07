// landing/landing.js
// ===================================================
// Desert Samurai Landing - Backend Controlled
// ===================================================

// ------------------ BACKEND URL ------------------
const BACKEND_URL =
    location.hostname === "localhost"
        ? "http://127.0.0.1:5000"
        : "https://gamefi2.onrender.com";

// ------------------ ELEMENTLER ------------------
const connectBtn = document.getElementById("connect-wallet");
const enterGameBtn = document.querySelector(".btn-samurai.big");

let walletAddress = null;

// =================================================
// CÜZDAN BAĞLAMA
// =================================================
connectBtn.onclick = async () => {
    if (!window.solana || !window.solana.isPhantom) {
        alert("Phantom Wallet kurulu değil!");
        return;
    }

    try {
        const resp = await window.solana.connect();
        walletAddress = resp.publicKey.toString();
        localStorage.setItem("walletAddress", walletAddress);

        connectBtn.innerText =
            walletAddress.slice(0, 4) +
            "..." +
            walletAddress.slice(-4);
        connectBtn.style.background = "#22c55e";
    } catch {
        alert("Cüzdan bağlantısı reddedildi.");
    }
};

// =================================================
// BACKEND ERİŞİM KONTROLÜ
// =================================================
async function checkAccess(wallet) {
    const res = await fetch(`${BACKEND_URL}/check-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet })
    });

    if (!res.ok) throw new Error("Backend hatası");
    return await res.json();
}

// =================================================
// ENTER GAME
// =================================================
window.enterGame = async () => {
    const wallet =
        walletAddress || localStorage.getItem("walletAddress");

    if (!wallet) {
        alert("Önce cüzdan bağlamalısın!");
        return;
    }

    enterGameBtn.innerText = "KONTROL EDİLİYOR...";
    enterGameBtn.disabled = true;

    try {
        const result = await checkAccess(wallet);

        if (!result.allowed) {
            alert(
                `Erişim reddedildi!\n\n` +
                `Gerekli: ${result.required} TOKEN\n` +
                `Sende olan: ${result.balance}`
            );
            return;
        }

        alert("Erişim Onaylandı! ⚔️");
        window.location.href = "game/game.html";

    } catch (err) {
        alert("Sunucu hatası.");
        console.error(err);
    } finally {
        enterGameBtn.disabled = false;
        enterGameBtn.innerText = "ENTER GAME";
    }
};

// =================================================
// OTOMATİK BAĞLANMA
// =================================================
window.addEventListener("load", async () => {
    const savedWallet = localStorage.getItem("walletAddress");

    if (savedWallet && window.solana?.isPhantom) {
        try {
            const resp = await window.solana.connect({
                onlyIfTrusted: true
            });

            walletAddress = resp.publicKey.toString();
            connectBtn.innerText =
                walletAddress.slice(0, 4) +
                "..." +
                walletAddress.slice(-4);
            connectBtn.style.background = "#22c55e";
        } catch {
            localStorage.removeItem("walletAddress");
        }
    }
});
