// MOCK WALLET CONNECT
document.getElementById("connect-wallet").onclick = function () {
    this.innerText = "0x71C...4f2E";
    this.style.background = "#22c55e";
};

// landing.js - Gerçek Cüzdan Bağlantısı
const connectBtn = document.getElementById("connect-wallet");

// landing.js
async function connectWallet() {
    // Solana cüzdanı (Phantom vb.) var mı kontrol et 
    const isPhantomInstalled = window.solana && window.solana.isPhantom;

    if (isPhantomInstalled) {
        try {
            // Cüzdana bağlanma isteği
            const response = await window.solana.connect();
            const walletAddr = response.publicKey.toString();
            
            // UI Güncelleme
            const btn = document.getElementById("connect-wallet");
            btn.innerText = walletAddr.slice(0, 4) + "..." + walletAddr.slice(-4);
            btn.style.background = "#22c55e"; // Başarılı yeşili

            // Cüzdan adresini kaydet
            localStorage.setItem("walletAddress", walletAddr);
            
            // 3. ADIM: İsim senkronizasyonunu başlat
            syncNameWithWallet(walletAddr);

        } catch (err) {
            console.error("Bağlantı hatası:", err);
        }
    } else {
        alert("Solana cüzdanı bulunamadı! Lütfen Phantom kurun.");
        window.open("https://phantom.app/", "_blank");
    }
}

// Butona fonksiyonu bağla
connectBtn.onclick = connectWallet;

// ENTER GAME
// landing.js
// landing.js

function enterGame() {
    // HTML'e dinamik bir modal ekleyelim
    const modalHTML = `
        <div id="setupModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; font-family:'Inter', sans-serif;">
            <div style="background:#0f0f0f; border:2px solid #d4af37; padding:2rem; border-radius:15px; width:400px; text-align:center; box-shadow: 0 0 30px rgba(212,175,55,0.3);">
                <h2 style="font-family:'Cinzel', serif; color:#d4af37; margin-bottom:1.5rem;">SAVAŞÇI PROFILI</h2>
                
                <input type="text" id="pName" placeholder="Adını Yaz..." style="width:100%; padding:10px; background:#1a1a1a; border:1px solid #333; color:white; margin-bottom:1rem; border-radius:5px;">
                
                <div style="text-align:left; margin-bottom:1rem;">
                    <label style="color:#aaa; font-size:0.8rem;">SAMURAY OKULU (YETENEK)</label>
                    <select id="pStyle" style="width:100%; padding:10px; background:#1a1a1a; border:1px solid #333; color:white; border-radius:5px;">
                        <option value="speed">Rüzgar Okulu (+Hız, -Menzil)</option>
                        <option value="power">Ateş Okulu (+Hasar Alanı, -Hız)</option>
                        <option value="balanced">Denge Okulu (Standart)</option>
                    </select>
                </div>

                <div style="text-align:left; margin-bottom:1.5rem;">
                    <label style="color:#aaa; font-size:0.8rem;">ZIRH RENGİ</label>
                    <div style="display:flex; gap:10px; margin-top:5px;">
                        <div onclick="window.selColor='#8b0000'" style="width:30px; height:30px; background:#8b0000; cursor:pointer; border-radius:50%; border:2px solid gold;"></div>
                        <div onclick="window.selColor='#22c55e'" style="width:30px; height:30px; background:#22c55e; cursor:pointer; border-radius:50%;"></div>
                        <div onclick="window.selColor='#3b82f6'" style="width:30px; height:30px; background:#3b82f6; cursor:pointer; border-radius:50%;"></div>
                    </div>
                </div>

                <button onclick="confirmStart()" class="btn-samurai" style="width:100%; cursor:pointer;">ÇÖLE ADIM AT</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    window.selColor = '#8b0000'; // Varsayılan renk
}

function confirmStart() {
    const name = document.getElementById('pName').value;
    const style = document.getElementById('pStyle').value;
    
    if(!name) return alert("İsimsiz bir samuray onurunu kaybetmiş demektir!");

    // Seçimleri Kaydet
    localStorage.setItem("playerName", name);
    localStorage.setItem("playerStyle", style);
    localStorage.setItem("playerColor", window.selColor);
    
    window.location.href = "game/game.html";
}


window.addEventListener("DOMContentLoaded", () => {
    const connectBtn = document.getElementById("connect-wallet");

    if (window.solana && window.solana.isPhantom) {
        console.log("Phantom yüklü!");
        connectBtn.onclick = async () => {
            try {
                const resp = await window.solana.connect();
                console.log("Connected:", resp.publicKey.toString());
                connectBtn.innerText = resp.publicKey.toString().slice(0,4) + "..." + resp.publicKey.toString().slice(-4);
                connectBtn.style.background = "#22c55e";
                localStorage.setItem("walletAddress", resp.publicKey.toString());
            } catch (err) {
                console.error(err);
            }
        };
    } else {
        console.log("Phantom yok veya sayfa HTTPS değil.");
    }
});
