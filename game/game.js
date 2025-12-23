const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerName = localStorage.getItem("playerName") || "Bilinmez Savaşçı";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isPaused = false;
let score = 0;
const keys = {};
const enemies = [];
const particles = []; // Görsel efektler için

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 22,
    color: '#8b0000', // Samurai Red
    speed: 5,
    isAttacking: false,
    attackAngle: 0,
    weaponRange: 60
};

// --- Girdiler ---
window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "Escape") toggleMenu();
});
window.addEventListener("keyup", e => keys[e.code] = false);

// Dövüş Mekaniği: Mouse tıklandığında kılıç savur
window.addEventListener("mousedown", () => {
    if (isPaused) return;
    player.isAttacking = true;
    setTimeout(() => player.isAttacking = false, 150); // 150ms saldırı süresi
});

function toggleMenu() {
    isPaused = !isPaused;
    if (isPaused) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "40px Cinzel";
        ctx.fillStyle = "#d4af37";
        ctx.textAlign = "center";
        ctx.fillText("OYUN DURDURULDU", canvas.width/2, canvas.height/2 - 20);
        ctx.font = "20px Inter";
        ctx.fillText("Devam etmek için ESC'ye bas", canvas.width/2, canvas.height/2 + 30);
    }
}

// --- Karakter Çizimi ---
// game.js - Başlangıç Ayarları
const config = {
    name: localStorage.getItem("playerName") || "Samuray",
    style: localStorage.getItem("playerStyle") || "balanced",
    color: localStorage.getItem("playerColor") || "#8b0000"
};

// Yetenek Ayarları (Okullara göre değişkenlik)
let playerStats = {
    speed: 5,
    range: 60,
    cooldown: 150
};

if(config.style === "speed") { playerStats.speed = 8; playerStats.range = 45; }
if(config.style === "power") { playerStats.speed = 3.5; playerStats.range = 90; playerStats.cooldown = 300; }

// Karakter Çiziminde Renk ve İsim Kullanımı
function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    // ... rotation kodları ...

    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = config.color; // Seçilen Renk
    ctx.fill();
    ctx.strokeStyle = "#d4af37"; // Gold
    ctx.stroke();

    // İsim Etiketi
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Inter";
    ctx.fillText(config.name, 0, -35);
    ctx.restore();
}

// ESC Menüsü Güncellemesi
function toggleMenu() {
    isPaused = !isPaused;
    const menu = document.getElementById("pauseMenu");
    if (isPaused) {
        // Dinamik Pause Menüsü
        const pauseHTML = `
            <div id="pauseMenu" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(10,10,10,0.95); border:1px solid #d4af37; padding:2rem; text-align:center; color:white; z-index:10000; border-radius:10px;">
                <h1 style="font-family:'Cinzel'; color:#d4af37;">MENÜ</h1>
                <p style="margin:1rem 0;">${config.name} - ${config.style.toUpperCase()} OKULU</p>
                <button onclick="location.reload()" style="background:#8b0000; color:white; padding:10px 20px; border:none; margin:5px; cursor:pointer;">DEVAM ET (ESC)</button>
                <button onclick="window.location.href='../index.html'" style="background:#333; color:white; padding:10px 20px; border:none; margin:5px; cursor:pointer;">ANA MENÜ</button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', pauseHTML);
    } else {
        if(menu) menu.remove();
    }
}

function checkMeleeHit(playerAngle) {
    enemies.forEach((en, i) => {
        const dist = Math.hypot(en.x - player.x, en.y - player.y);
        const angleToEnemy = Math.atan2(en.y - player.y, en.x - player.x);
        const angleDiff = Math.abs(playerAngle - angleToEnemy);

        if (dist < player.weaponRange + en.radius && angleDiff < 0.8) {
            enemies.splice(i, 1);
            score += 25;
            document.getElementById("scoreVal").innerText = score;
        }
    });
}

function spawnEnemy() {
    if (isPaused) return;
    const size = 18;
    // ... (Önceki düşman spawn kodları aynı kalabilir)
}
setInterval(spawnEnemy, 1000);

function animate() {
    if (!isPaused) {
        ctx.fillStyle = "#d2b48c"; // Çöl rengi
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Hareket Kontrolü
        if (keys['KeyW']) player.y -= player.speed;
        if (keys['KeyS']) player.y += player.speed;
        if (keys['KeyA']) player.x -= player.speed;
        if (keys['KeyD']) player.x += player.speed;

        drawPlayer();
        
        // Düşmanları Güncelle
        enemies.forEach((en, i) => {
            const angle = Math.atan2(player.y - en.y, player.x - en.x);
            en.x += Math.cos(angle) * 2;
            en.y += Math.sin(angle) * 2;
            
            ctx.beginPath();
            ctx.arc(en.x, en.y, en.size || 18, 0, Math.PI*2);
            ctx.fillStyle = "#1a1a1a";
            ctx.fill();

            // Çarpışma: Oyuncu Ölümü
            if (Math.hypot(player.x - en.x, player.y - en.y) < player.radius + 15) {
                alert(`Onurlu Savaşçı ${playerName} düştü!\nSkorun: ${score}`);
                window.location.href = "../index.html";
            }
        });
    }
    requestAnimationFrame(animate);
}
animate();