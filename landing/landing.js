// landing.js
// =====================================================
// Desert Samurai - Secure Frontend Logic
// =====================================================

// -------------------- AYARLAR --------------------
const BACKEND_URL = "https://gamefi2.onrender.com";

// -------------------- ELEMENTLER --------------------
const connectBtn = document.getElementById("connect-wallet");
const enterGameBtn = document.querySelector(".btn-samurai.big");

// -------------------- GLOBAL --------------------
let walletAddress = null;

// =====================================================
// 1️⃣ CÜZDAN BAĞLAMA
// =====================================================
connectBtn.onclick = async () => {
    if (!window.solana || !window.solana.isPhantom) {
        alert("Lütfen Phantom Wallet kur!");
        return;
    }

    try {
        const resp = await window.solana.connect();
        walletAddress = resp.publicKey.toString();

        localStorage.setItem("walletAddress", walletAddress);

        connectBtn.innerText =
            walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4);
        connectBtn.style.background = "#22c55e";

        console.log("Cüzdan bağlandı:", walletAddress);
    } catch (err) {
        console.warn("Cüzdan bağlantısı reddedildi");
    }
};

// =====================================================
// 2️⃣ BACKEND’E ERİŞİM KONTROLÜ
// =====================================================
async function checkAccess(wallet) {
    const response = await fetch(`${BACKEND_URL}/check-access`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ wallet })
    });

    if (!response.ok) {
        throw new Error("Backend erişim hatası");
    }

    return await response.json();
}

// =====================================================
// 3️⃣ ENTER GAME
// =====================================================
window.enterGame = async function () {
    const wallet =
        walletAddress || localStorage.getItem("walletAddress");

    if (!wallet) {
        alert("Önce cüzdanını bağla!");
        return;
    }

    enterGameBtn.disabled = true;
    enterGameBtn.innerText = "KONTROL EDİLİYOR...";

    try {
        const result = await checkAccess(wallet);

        /*
            Backend response örneği:
            {
              allowed: true,
              balance: 150,
              required: 100
            }
        */

        if (result.allowed) {
            alert("Erişim onaylandı! 🏯");
            window.location.href = "game/game.html";
        } else {
            alert(
                `Yetersiz bakiye!\n\n` +
                `Mevcut: ${result.balance}\n` +
                `Gerekli: ${result.required}`
            );
        }
    } catch (err) {
        console.error(err);
        alert("Sunucu hatası. Lütfen tekrar dene.");
    } finally {
        enterGameBtn.disabled = false;
        enterGameBtn.innerText = "ENTER GAME";
    }
};

// =====================================================
// 4️⃣ SAYFA YÜKLENİNCE OTOMATİK BAĞLAN
// =====================================================
window.addEventListener("load", async () => {
    const savedWallet = localStorage.getItem("walletAddress");

    if (
        savedWallet &&
        window.solana &&
        window.solana.isPhantom
    ) {
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

            console.log("Otomatik bağlanıldı:", walletAddress);
        } catch (err) {
            console.warn("Otomatik bağlantı başarısız");
            localStorage.removeItem("walletAddress");
        }
    }
});
