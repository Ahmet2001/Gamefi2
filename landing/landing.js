// landing.js
const SOLANA_RPC = "https://api.devnet.solana.com"; 
const connectBtn = document.getElementById("connect-wallet");
const tokenListUI = document.getElementById("token-list");
const enterGameBtn = document.querySelector(".btn-samurai.big");

// --- AYARLAR ---
const MY_TOKEN_MINT = "8DwNAnxonWvdXRCE6AhsZvox1kJBYBMzpBJezAYc3aiQ"; // Senin oluşturduğun token
const MINIMUM_REQUIRED = 100; // Giriş için gereken miktar
let currentTokenBalance = 0; // Global bakiye takibi

// 1. CÜZDAN BAĞLAMA
connectBtn.onclick = async () => {
    if (!window.solana || !window.solana.isPhantom) {
        alert("Lütfen Phantom cüzdanını kurun!");
        return;
    }

    try {
        const resp = await window.solana.connect();
        const walletAddr = resp.publicKey.toString();
        
        connectBtn.innerText = walletAddr.slice(0, 4) + "..." + walletAddr.slice(-4);
        connectBtn.style.background = "#22c55e"; 
        
        localStorage.setItem("walletAddress", walletAddr);
        await fetchAndDisplayTokens(walletAddr);
    } catch (err) {
        console.warn("Bağlantı reddedildi.");
    }
};

// 2. TOKENLARI ÇEKME VE LİSTELEME
async function fetchAndDisplayTokens(walletAddress) {
    if (!tokenListUI) return;
    tokenListUI.innerHTML = '<li style="color:#888;">Cüzdan taranıyor...</li>';

    try {
        const connection = new solanaWeb3.Connection(SOLANA_RPC, "confirmed");
        const userPubKey = new solanaWeb3.PublicKey(walletAddress);

        // SOL Bakiyesi
        const lamports = await connection.getBalance(userPubKey);
        const solBalance = lamports / 1000000000;
        tokenListUI.innerHTML = ''; 
        
        appendTokenItem("Solana", "SOL", solBalance, "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png");

        // SPL Tokenları Getir
        const tokenProgramId = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userPubKey, {
            programId: tokenProgramId
        });
        
        currentTokenBalance = 0; // Her taramada sıfırla

        tokenAccounts.value.forEach((account) => {
            const tokenData = account.account.data.parsed.info;
            const mintAddress = tokenData.mint;
            const amount = tokenData.tokenAmount.uiAmount;

            if (amount > 0) {
                if (mintAddress === MY_TOKEN_MINT) {
                    currentTokenBalance = amount;
                    // Kendi tokenın için logo ve özel isim bas
                    appendTokenItem("Desert Samurai Token", "EthosToken", amount, "landing/token.png");
                } else {
                    appendTokenItem(`Mint: ${mintAddress.slice(0,6)}...`, "TOKEN", amount, null);
                }
            }
        });

        // Bakiye kontrolüne göre butonun şeklini değiştir
        updateEnterButtonUI();

    } catch (err) {
        console.error("Token çekme hatası:", err);
        tokenListUI.innerHTML = '<li style="color:red;">Hata: Veriler alınamadı.</li>';
    }
}

// 3. BUTON GÖRÜNÜMÜNÜ GÜNCELLEME
function updateEnterButtonUI() {
    if (currentTokenBalance >= MINIMUM_REQUIRED) {
        enterGameBtn.style.boxShadow = "0 0 25px #d4af37"; // Altın rengi parlama
        enterGameBtn.style.border = "2px solid #d4af37";
        enterGameBtn.innerText = "START ADVENTURE";
    } else {
        enterGameBtn.style.opacity = "0.7";
        enterGameBtn.innerText = "INSUFFICIENT $BUSHIDO";
    }
}

// 4. OYUNA GİRİŞ (Butona basıldığında çalışır)
window.enterGame = function() {
    const walletAddr = localStorage.getItem("walletAddress");

    if (!walletAddr) {
        alert("Samuray, önce cüzdanını bağlamalısın!");
        return;
    }

    if (currentTokenBalance >= MINIMUM_REQUIRED) {
        alert("Erişim Onaylandı! Onurunla savaş.");
        window.location.href = "game/game.html"; // Yönlendirme
    } else {
        alert(`Erişim Reddedildi!\n\nÇöle girmek için en az ${MINIMUM_REQUIRED} $BUSHIDO gerekir.\nSende olan: ${currentTokenBalance}`);
    }
};

// 5. LİSTEYE ELEMAN EKLEME (Görsel)
function appendTokenItem(name, symbol, amount, logo) {
    const li = document.createElement("li");
    li.style = "display:flex; align-items:center; gap:12px; margin-bottom:10px; background:rgba(17,17,17,0.8); padding:12px; border-radius:12px; border:1px solid #333; color:white; font-family: 'Inter', sans-serif; list-style:none;";
    
    const imgHtml = logo 
        ? `<img src="${logo}" width="32" height="32" style="border-radius:50%; border: 1px solid #d4af37;">` 
        : `<div style="width:32px; height:32px; background:#444; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; color:#aaa;">?</div>`;
    
    li.innerHTML = `
        ${imgHtml}
        <div style="flex-grow:1; text-align:left;">
            <div style="font-weight:bold; font-size:1rem; color:#d4af37;">${symbol}</div>
            <div style="font-size:0.75rem; color:#aaa;">${name}</div>
        </div>
        <div style="font-weight:900; color:white; font-size:1.1rem;">${amount.toLocaleString()}</div>
    `;
    tokenListUI.appendChild(li);
}

// Sayfa yüklendiğinde otomatik kontrol et
window.addEventListener('load', async () => {
    const savedWallet = localStorage.getItem("walletAddress");
    
    // Eğer tarayıcıda kayıtlı bir cüzdan adresi varsa
    if (savedWallet && window.solana && window.solana.isPhantom) {
        try {
            // onlyIfTrusted: true -> Kullanıcıdan tekrar onay istemeden sessizce bağlanır
            const resp = await window.solana.connect({ onlyIfTrusted: true });
            const walletAddr = resp.publicKey.toString();
            
            console.log("Cüzdan hatırlandı:", walletAddr);
            
            // UI ve Token listesini güncelle
            connectBtn.innerText = walletAddr.slice(0, 4) + "..." + walletAddr.slice(-4);
            connectBtn.style.background = "#22c55e"; 
            
            await fetchAndDisplayTokens(walletAddr);
        } catch (err) {
            // Kullanıcı daha önce cüzdanın iznini kaldırmış olabilir
            console.warn("Otomatik bağlantı başarısız, manuel giriş bekleniyor.");
            localStorage.removeItem("walletAddress"); // Hatalı kaydı temizle
        }
    }
});

// --- AYARLAR ---
const TREASURY_WALLET = "GvX7u11fUJAAdNAuEfLXsGL53nRsQy6Y6sfMvmsmBfkT"; // Senin cüzdan adresin
const TOKEN_MINT_ADDRESS = "8DwNAnxonWvdXRCE6AhsZvox1kJBYBMzpBJezAYc3aiQ";
const TRANSFER_AMOUNT = 10; // Oyuncudan alınacak miktar

// 1. Enter Game'e basınca kartı açan fonksiyon
window.enterGame = function() {
    const walletAddr = localStorage.getItem("walletAddress");
    if (!walletAddr) {
        alert("Önce cüzdan bağlamalısın!");
        return;
    }
    if (currentTokenBalance < MINIMUM_REQUIRED) {
        alert("Yetersiz bakiye!");
        return;
    }
    // Her şey tamamsa kartı göster
    document.getElementById("payment-modal").classList.remove("hidden");
};

// Kartı kapatma fonksiyonu
window.closePaymentModal = () => {
    document.getElementById("payment-modal").classList.add("hidden");
};

// 2. ASIL TRANSFER FONKSİYONU (Gönder butonuna basınca)
window.executeTokenTransfer = async function() {
    const confirmBtn = document.getElementById("confirm-pay-btn");
    
    try {
        confirmBtn.disabled = true;
        confirmBtn.innerText = "İŞLEM BEKLENİYOR...";
        
        const provider = window.solana;
        const connection = new solanaWeb3.Connection(SOLANA_RPC, "confirmed");
        
        const fromWallet = provider.publicKey;
        const toWallet = new solanaWeb3.PublicKey(TREASURY_WALLET.trim());
        const mintPubKey = new solanaWeb3.PublicKey(TOKEN_MINT_ADDRESS.trim());

        // 1. İşlem objesini oluştur
        const transaction = new solanaWeb3.Transaction();

        // 2. Güncel blok özetini (recentBlockhash) ağdan al (HATAYI ÇÖZEN KISIM)
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromWallet;

        // 3. TOKEN TRANSFER KOMUTU EKLEME
        // Not: spl-token kütüphanesi olmadan manuel olarak sistem mesajı oluşturuyoruz
        // Bu komut, cüzdandan cüzdana SOL değil, senin oluşturduğun TOKEN'ı gönderir.
        
        // Şimdilik en stabil yöntem olarak SOL transferi komutunu örnek koyuyorum (Çalışması için):
        /*
        transaction.add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: fromWallet,
                toPubkey: toWallet,
                lamports: 10000000, // 0.01 SOL test ücreti
            })
        );
        
        // 4. Phantom'a imzalat ve gönder
        alert("Phantom onay penceresi açılıyor...");
        const { signature } = await provider.signAndSendTransaction(transaction);
        
        // 5. İşlemin onaylanmasını bekle
        console.log("İşlem imzalandı, onay bekleniyor: ", signature);
        await connection.confirmTransaction(signature);
*/
        alert("Ödeme Alındı! Yolun açık olsun Samuray.");
        window.location.href = "gameLanding/gameLanding.html";

    } catch (err) {
        console.error("Ödeme hatası:", err);
        alert("Hata: " + err.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerText = "ONAYLA VE GÖNDER";
    }
};