/**
 * SAMURAY YOLU - GELİŞMİŞ OYUN MOTORU
 */

// --- GLOBAL DEĞİŞKENLER ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const hudMapCanvas = document.getElementById("hud-map-canvas");
const hctx = hudMapCanvas.getContext("2d");

// --- YAPILANDIRMA VE SINIRLAR ---
const WORLD_SIZE = 15000;
let canvasWidth, canvasHeight;
let isPaused = false;
let isMenuOpen = false;
let isPauseMenuOpen = false;
let score = 0;
let shakeAmount = 0;

const keys = {};
const enemies = [];
const particles = [];
const slashes = [];
const materials = [];
const bushes = [];
const sandParticles = []; // SADECE BİR KEZ TANIMLA

// Envanter sistemi
const inventory = {
    wood: 0,
    stone: 0,
    herbs: 0,
    scrolls: 0
};

const config = {
    name: localStorage.getItem("playerName") || "Samuray",
    color: localStorage.getItem("playerColor") || "#8b0000"
};

const player = {
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    radius: 20,
    hp: 100,
    maxHp: 100,
    speed: 5.5,
    angle: 0,
    isAttacking: false,
    attackFrame: 0,
    isDashing: false,
    dashSpeed: 24,
    dashDuration: 10,
    dashCooldown: 50,
    dashCooldownTimer: 0,
    cloakNodes: Array.from({length: 10}, () => ({x: WORLD_SIZE/2, y: WORLD_SIZE/2})),
    mousePos: { x: 0, y: 0 },
    swordVisible: false,
    swordSwingProgress: 0,
    dashTimer: 0 // EKSİK OLAN EKLENDİ
};

// ASSETS sistemi
const ASSETS = {
    player: null,
    enemy: null,
    materials: null
};

// --- PIXEL ART ARKA PLAN SİSTEMİ ---
const worldBackground = new Image();
worldBackground.src = '/pixilart-drawing.png'; // YOLUNUZU KONTROL EDİN

let worldBgLoaded = false;
let worldBgWidth = 0;
let worldBgHeight = 0;

worldBackground.onload = function() {
    worldBgLoaded = true;
    worldBgWidth = this.width;
    worldBgHeight = this.height;
    
    console.log(`✅ Pixel art arka plan yüklendi!`);
    console.log(`📐 Boyut: ${worldBgWidth}x${worldBgHeight}px`);
    
    if (worldBgWidth !== WORLD_SIZE || worldBgHeight !== WORLD_SIZE) {
        console.log(`ℹ️  Görsel ölçeklenecek...`);
    }
};

worldBackground.onerror = function() {
    console.error('❌ Arka plan görseli yüklenemedi!');
};

// --- YARDIMCI FONKSİYONLAR ---
function adjustPixelColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function drawPixelArtWorldBackground() {
    // 1. Önce arkaplanı temizle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-camX, -camY, canvasWidth, canvasHeight);
    
    // 2. PİXEL ART ARKA PLANI ÇİZ
    if (worldBgLoaded) {
        // PİXEL-PERFECT AYARLARI
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';
        
        // Görseli çiz
        ctx.drawImage(
            worldBackground,
            0, 0,
            worldBgWidth, worldBgHeight,
            0, 0,
            WORLD_SIZE, WORLD_SIZE
        );
    } else {
        // Görsel yüklenene kadar basit arka plan
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
        
        // Izgara çiz
        drawPixelArtGrid();
    }
    
    // 3. Dünya sınırı
    drawPixelArtWorldBorder();
}

function drawPixelArtGrid() {
    const gridSize = 200;
    const lineWidth = 1;
    
    ctx.strokeStyle = "rgba(212, 175, 55, 0.1)";
    ctx.lineWidth = lineWidth;
    
    ctx.beginPath();
    
    // Dikey çizgiler
    for (let x = 0; x <= WORLD_SIZE; x += gridSize) {
        const snappedX = Math.floor(x) + 0.5;
        ctx.moveTo(snappedX, 0);
        ctx.lineTo(snappedX, WORLD_SIZE);
    }
    
    // Yatay çizgiler
    for (let y = 0; y <= WORLD_SIZE; y += gridSize) {
        const snappedY = Math.floor(y) + 0.5;
        ctx.moveTo(0, snappedY);
        ctx.lineTo(WORLD_SIZE, snappedY);
    }
    
    ctx.stroke();
}

function drawPixelArtWorldBorder() {
    const borderWidth = 8;
    
    // Kalın dış border
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
        borderWidth/2, 
        borderWidth/2, 
        WORLD_SIZE - borderWidth, 
        WORLD_SIZE - borderWidth
    );
}

function showLoadingStatus() {
    if (!worldBgLoaded) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        ctx.fillStyle = '#d4af37';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ Pixel art arka plan yükleniyor...', canvasWidth/2, canvasHeight/2);
        
        ctx.restore();
    }
}

// --- OYUN FONKSİYONLARI ---
function resize() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

function goToMainMenu(){
    window.location.href = '/gameLanding/gameLanding.html';
}

function createBushes() {
    const bushCount = 300;
    
    for(let i = 0; i < bushCount; i++) {
        bushes.push({
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            radius: 20 + Math.random() * 15,
            type: Math.floor(Math.random() * 3),
            isHarvested: false,
            respawnTimer: 0
        });
    }
}

function spawnInitialMaterials() {
    const materialCount = 100;
    
    for(let i = 0; i < materialCount; i++) {
        spawnMaterial();
    }
}

function spawnMaterial() {
    const types = [
        {name: "wood", color: "#8B4513", symbol: "🪵"},
        {name: "stone", color: "#808080", symbol: "🪨"},
        {name: "herbs", color: "#228B22", symbol: "🌿"},
        {name: "scrolls", color: "#DAA520", symbol: "📜"}
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    materials.push({
        x: Math.random() * WORLD_SIZE,
        y: Math.random() * WORLD_SIZE,
        radius: 12,
        type: type.name,
        color: type.color,
        symbol: type.symbol,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
    });
}

// --- GİRDİ YÖNETİMİ ---
window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "KeyY" && !isPauseMenuOpen) toggleCharacterMenu();
    if (e.code === "Escape") isMenuOpen ? toggleCharacterMenu() : togglePauseMenu();
    if (e.code === "Space") performDash();
    if (e.code === "KeyI" && !isPauseMenuOpen) toggleInventory();
});
window.addEventListener("keyup", e => keys[e.code] = false);
window.addEventListener("mousemove", e => {
    player.mousePos.x = e.clientX;
    player.mousePos.y = e.clientY;
});
window.addEventListener("mousedown", () => {
    if (!isPaused && !player.isAttacking) performAttack();
});
window.addEventListener("resize", resize);

// --- MENÜLER ---
function toggleCharacterMenu() {
    isMenuOpen = !isMenuOpen;
    isPaused = isMenuOpen || isPauseMenuOpen;
    document.getElementById("menu-overlay").style.display = isMenuOpen ? "flex" : "none";
    if (isMenuOpen) updateStatsUI();
}

function togglePauseMenu() {
    isPauseMenuOpen = !isPauseMenuOpen;
    isPaused = isMenuOpen || isPauseMenuOpen;
    document.getElementById("pause-menu").style.display = isPauseMenuOpen ? "flex" : "none";
}

function toggleInventory() {
    const inventoryOverlay = document.getElementById("inventory-overlay");
    const isVisible = inventoryOverlay.style.display === "flex";
    inventoryOverlay.style.display = isVisible ? "none" : "flex";
    if (!isVisible) updateInventoryUI();
}

function updateStatsUI() {
    document.getElementById("stat-name").innerText = config.name;
    document.getElementById("stat-hp").innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
    document.getElementById("stat-speed").innerText = player.speed;
    document.getElementById("stat-score").innerText = score;
}

function updateInventoryUI() {
    document.getElementById("inv-wood").innerText = inventory.wood;
    document.getElementById("inv-stone").innerText = inventory.stone;
    document.getElementById("inv-herbs").innerText = inventory.herbs;
    document.getElementById("inv-scrolls").innerText = inventory.scrolls;
}

// --- OYUN MEKANİKLERİ ---
function performAttack() {
    player.isAttacking = true;
    player.swordVisible = true;
    player.swordSwingProgress = 0;
    const angle = player.angle;
    
    // Kılıç efekti
    slashes.push({ 
        x: player.x, 
        y: player.y, 
        angle: angle, 
        life: 1.0, 
        range: 110,
        width: 8
    });
    
    // Düşmanlara hasar
    enemies.forEach((en, i) => {
        const dist = Math.hypot(en.x - player.x, en.y - player.y);
        const angleToEn = Math.atan2(en.y - player.y, en.x - player.x);
        let diff = Math.abs(angle - angleToEn);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (dist < 120 && diff < 1.2) {
            createBlood(en.x, en.y);
            enemies.splice(i, 1);
            score += 50;
            shakeAmount = 15;
            document.getElementById("scoreVal").innerText = score;
        }
    });
    
    // Materyal toplama
    materials.forEach((mat, i) => {
        const dist = Math.hypot(mat.x - player.x, mat.y - player.y);
        const angleToMat = Math.atan2(mat.y - player.y, mat.x - player.x);
        let diff = Math.abs(angle - angleToMat);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (dist < 100 && diff < 1.5 && !mat.collected) {
            mat.collected = true;
            inventory[mat.type]++;
            updateInventoryUI();
            
            // Partiküller
            for(let j = 0; j < 8; j++) {
                particles.push({
                    x: mat.x,
                    y: mat.y,
                    vx: (Math.random()-0.5)*6,
                    vy: (Math.random()-0.5)*6 - 3,
                    life: 1.0,
                    color: mat.color,
                    size: Math.random()*3 + 2,
                    gravity: 0.1
                });
            }
            
            setTimeout(() => {
                if (mat.collected) {
                    mat.x = Math.random() * WORLD_SIZE;
                    mat.y = Math.random() * WORLD_SIZE;
                    mat.collected = false;
                    mat.bobOffset = Math.random() * Math.PI * 2;
                }
            }, 10000);
        }
    });
    
    // Çalı toplama
    bushes.forEach((bush, i) => {
        const dist = Math.hypot(bush.x - player.x, bush.y - player.y);
        const angleToBush = Math.atan2(bush.y - player.y, bush.x - player.x);
        let diff = Math.abs(angle - angleToBush);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;

        if (dist < 100 && diff < 1.5 && !bush.isHarvested) {
            bush.isHarvested = true;
            bush.respawnTimer = 300;
            inventory.wood += bush.type === 0 ? 1 : bush.type === 1 ? 2 : 1;
            updateInventoryUI();
            
            const leafColor = bush.type === 2 ? "#8B4513" : "#228B22";
            for(let j = 0; j < 12; j++) {
                particles.push({
                    x: bush.x,
                    y: bush.y,
                    vx: (Math.random()-0.5)*8,
                    vy: (Math.random()-0.5)*8 - 2,
                    life: 1.0,
                    color: leafColor,
                    size: Math.random()*4 + 2,
                    gravity: 0.05
                });
            }
        }
    });

    setTimeout(() => {
        player.isAttacking = false;
        setTimeout(() => player.swordVisible = false, 200);
    }, 150);
}

function performDash() {
    if (player.dashCooldownTimer > 0 || isPaused) return;
    player.isDashing = true;
    player.dashTimer = player.dashDuration;
    player.dashCooldownTimer = player.dashCooldown;
    shakeAmount = 8;
}

function createBlood(x, y) {
    for(let i=0; i<15; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*12, 
            vy: (Math.random()-0.5)*12, 
            life: 1.0, 
            color: '#8b0000',
            size: Math.random()*4 + 2,
            gravity: 0.1
        });
    }
}

function spawnEnemy() {
    if (isPaused || enemies.length > 12) return;
    
    const angle = Math.random() * Math.PI * 2;
    const dist = 600 + Math.random() * 200;
    
    const enemyTypes = [
        { speed: 1.5, radius: 16, color: "#8B0000", hat: true },
        { speed: 2.0, radius: 14, color: "#4B0082", hat: false },
        { speed: 1.8, radius: 18, color: "#2F4F4F", hat: true }
    ];
    
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    enemies.push({
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist,
        speed: type.speed + Math.random() * 0.5,
        radius: type.radius,
        color: type.color,
        hasHat: type.hat,
        originalSpeed: type.speed + Math.random() * 0.5,
        attackCooldown: 0
    });
}

// Düşman spawn hızını normale döndür (1500ms)
setInterval(spawnEnemy, 1500);

function createSandStorm(x, y, intensity) {
    for(let i = 0; i < intensity; i++) {
        sandParticles.push({
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 200,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0.5 + Math.random() * 0.5,
            size: Math.random() * 3 + 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
}

// --- RADAR ---
function renderHudMiniMap() {
    const mapSize = 1500;
    hudMapCanvas.width = mapSize;
    hudMapCanvas.height = mapSize;
    const scale = mapSize / WORLD_SIZE;

    hctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    hctx.fillRect(0, 0, mapSize, mapSize);
    
    hctx.strokeStyle = "#d4af37";
    hctx.lineWidth = 2;
    hctx.strokeRect(0, 0, mapSize, mapSize);

    hctx.fillStyle = "red";
    enemies.forEach(en => {
        hctx.beginPath();
        hctx.arc(en.x * scale, en.y * scale, 2, 0, Math.PI*2);
        hctx.fill();
    });

    materials.forEach(mat => {
        if (!mat.collected) {
            hctx.fillStyle = mat.color;
            hctx.beginPath();
            hctx.arc(mat.x * scale, mat.y * scale, 1.5, 0, Math.PI*2);
            hctx.fill();
        }
    });

    hctx.fillStyle = "white";
    hctx.beginPath();
    hctx.arc(player.x * scale, player.y * scale, 3, 0, Math.PI*2);
    hctx.fill();
}

// --- ANA DÖNGÜ ---
let camX, camY; // Kamera değişkenlerini global yap

function animate() {
    if (!isPaused) {
        // 1. Ekranı temizle ve kamerayı ayarla
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        let sx = (Math.random() - 0.5) * shakeAmount;
        let sy = (Math.random() - 0.5) * shakeAmount;
        if (!document.getElementById("shake-toggle")) { 
            sx = 0; sy = 0; 
        } else if (!document.getElementById("shake-toggle").checked) {
            sx = 0; sy = 0;
        }
        shakeAmount *= 0.9;
        
        camX = -player.x + canvasWidth / 2 + sx;
        camY = -player.y + canvasHeight / 2 + sy;
        ctx.translate(camX, camY);
        
        // 2. Pixel art arka plan
        drawPixelArtWorldBackground();
        
        // 3. Yükleme durumu
        if (!worldBgLoaded) {
            showLoadingStatus();
        }
        
        // 4. Kum fırtınası kontrolü
        const isInStorm = player.x < 0 || player.x > WORLD_SIZE || player.y < 0 || player.y > WORLD_SIZE;
        const vignette = document.getElementById("vignette");
        
        if (vignette) {
            if (isInStorm) {
                player.hp -= 0.4;
                shakeAmount += 2;
                vignette.classList.add("storm-active");
                vignette.style.boxShadow = `inset 0 0 200px rgba(212, 110, 37, 0.8)`;
                
                if (Math.random() < 0.3) {
                    createSandStorm(player.x + (Math.random() - 0.5) * 500,
                        player.y + (Math.random() - 0.5) * 500, 3);
                }
            } else {
                vignette.classList.remove("storm-active");
                vignette.style.boxShadow = `inset 0 0 100px rgba(139,0,0,${(1 - player.hp / 100) * 0.6})`;
            }
        }
        
        // 5. Ölüm kontrolü
        if (player.hp <= 0) {
            const finalScore = score;
            const finalMaterials = `🪵${inventory.wood} 🪨${inventory.stone} 🌿${inventory.herbs} 📜${inventory.scrolls}`;
            alert(`⚔️ ONURUNLA CAN VERDİN!\n\n🏆 Skor: ${finalScore}\n📦 Materyaller: ${finalMaterials}`);
            location.reload();
        }
        
        // 6. Hareket mantığı
        if (player.isDashing) {
            player.x += Math.cos(player.angle) * player.dashSpeed;
            player.y += Math.sin(player.angle) * player.dashSpeed;
            player.dashTimer--;
            if (player.dashTimer <= 0) player.isDashing = false;
        } else {
            let mx = 0, my = 0;
            if (keys.KeyW) my--;
            if (keys.KeyS) my++;
            if (keys.KeyA) mx--;
            if (keys.KeyD) mx++;
            
            if (mx || my) {
                const moveAngle = Math.atan2(my, mx);
                player.x += Math.cos(moveAngle) * player.speed;
                player.y += Math.sin(moveAngle) * player.speed;
            }
        }
        
        // 7. Fare açısı
        player.angle = Math.atan2(
            player.mousePos.y - canvasHeight / 2,
            player.mousePos.x - canvasWidth / 2
        );
        
        // 8. Saldırı animasyonu
        if (player.isAttacking) {
            player.swordSwingProgress += 0.15;
            if (player.swordSwingProgress > 1) {
                player.swordSwingProgress = 1;
                player.isAttacking = false;
            }
        }
        
        // 9. Cooldown'lar
        if (player.dashCooldownTimer > 0) player.dashCooldownTimer--;
        
        // 10. Pelerin
        player.cloakNodes[0] = { x: player.x, y: player.y };
        for (let i = 1; i < player.cloakNodes.length; i++) {
            let p = player.cloakNodes[i - 1];
            let n = player.cloakNodes[i];
            n.x += (p.x - n.x) * 0.25;
            n.y += (p.y - n.y) * 0.25;
            
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 20 - i * 1.8;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
        }
        
        // 11. Samuray çizimi
        drawLegacyPlayer(); // Önce basit çizim
        
        // 12. Kılıç efektleri
        slashes.forEach((s, i) => {
            const alpha = s.life * 0.8;
            ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
            ctx.lineWidth = s.width;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.range, s.angle - 0.5, s.angle + 0.5);
            ctx.stroke();
            
            s.life -= 0.08;
            s.width *= 0.95;
            if (s.life <= 0) slashes.splice(i, 1);
        });
        
        // 13. Düşmanlar
        enemies.forEach((en, i) => {
            let a = Math.atan2(player.y - en.y, player.x - en.x);
            en.x += Math.cos(a) * en.speed;
            en.y += Math.sin(a) * en.speed;
            
            // Çizim
            ctx.save();
            ctx.translate(en.x, en.y);
            ctx.rotate(a + Math.PI / 2);
            
            ctx.fillStyle = en.color;
            ctx.beginPath();
            ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "#111";
            ctx.fillRect(-6, -5, 4, 3);
            ctx.fillRect(2, -5, 4, 3);
            
            ctx.beginPath();
            ctx.arc(0, 3, 4, 0, Math.PI);
            ctx.fill();
            
            if (en.hasHat) {
                ctx.fillStyle = "#2F4F4F";
                ctx.fillRect(-10, -en.radius - 5, 20, 8);
                ctx.fillRect(-6, -en.radius - 15, 12, 10);
            }
            
            ctx.restore();
            
            // Hasar
            if (Math.hypot(player.x - en.x, player.y - en.y) < 35) {
                if (en.attackCooldown <= 0) {
                    player.hp -= 8;
                    shakeAmount = 5;
                    en.attackCooldown = 60;
                    createBlood(player.x, player.y);
                }
            }
            
            if (en.attackCooldown > 0) en.attackCooldown--;
        });
        
        // 14. Materyaller
        materials.forEach((mat) => {
            if (mat.collected) return;
            
            const bobY = Math.sin(Date.now() * 0.001 + mat.bobOffset) * 5;
            
            ctx.save();
            ctx.shadowColor = mat.color;
            ctx.shadowBlur = 15;
            
            ctx.fillStyle = mat.color;
            ctx.beginPath();
            ctx.arc(mat.x, mat.y + bobY, mat.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowBlur = 0;
            ctx.fillText(mat.symbol, mat.x, mat.y + bobY);
            ctx.restore();
            
            // Otomatik toplama
            const dist = Math.hypot(mat.x - player.x, mat.y - player.y);
            if (dist < 40 && !mat.collected) {
                mat.collected = true;
                inventory[mat.type]++;
                updateInventoryUI();
            }
        });
        
        // 15. Çalılar
        bushes.forEach((bush) => {
            if (bush.isHarvested) {
                bush.respawnTimer--;
                if (bush.respawnTimer <= 0) bush.isHarvested = false;
                return;
            }
            
            ctx.save();
            ctx.translate(bush.x, bush.y);
            
            let bushColor;
            switch (bush.type) {
                case 0: bushColor = "#2E8B57"; break;
                case 1: bushColor = "#228B22"; break;
                case 2: bushColor = "#8B4513"; break;
            }
            
            ctx.fillStyle = "#8B4513";
            ctx.fillRect(-3, -10, 6, 15);
            
            ctx.fillStyle = bushColor;
            for (let j = 0; j < 6; j++) {
                const angle = (j * Math.PI) / 3;
                const dist = bush.radius * 0.7;
                ctx.beginPath();
                ctx.ellipse(
                    Math.cos(angle) * dist * 0.6,
                    Math.sin(angle) * dist * 0.6,
                    bush.radius * 0.8,
                    bush.radius * 0.5,
                    angle, 0, Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        // 16. Partiküller
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += (p.gravity || 0);
            p.life -= 0.02;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            
            if (p.life <= 0) particles.splice(i, 1);
        });
        ctx.globalAlpha = 1;
        
        // 17. Kum partikülleri
        sandParticles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            p.rotation += p.rotationSpeed;
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = `rgba(212, 175, 55, ${p.life * 0.7})`;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            
            if (p.life <= 0) sandParticles.splice(i, 1);
        });
        
        // 18. UI
        const hpBar = document.getElementById("hp-bar");
        if (hpBar) hpBar.style.width = player.hp + "%";
        
        const scoreVal = document.getElementById("scoreVal");
        if (scoreVal) scoreVal.innerText = score;
        
        const invPreview = document.getElementById("inv-preview");
        if (invPreview) {
            invPreview.innerHTML = `🪵${inventory.wood} 🪨${inventory.stone} 🌿${inventory.herbs} 📜${inventory.scrolls}`;
        }
        
        // 19. Mini map
        renderHudMiniMap();
    }
    
    requestAnimationFrame(animate);
}

// Oyuncu çizimi
function drawLegacyPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Gövde
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Şapka
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.ellipse(0, -15, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.lineTo(-20, -35);
    ctx.lineTo(20, -35);
    ctx.lineTo(15, -15);
    ctx.closePath();
    ctx.fill();
    
    // Kılıç
    if (player.isAttacking) {
        const swingAngle = Math.sin(player.swordSwingProgress * Math.PI) * 1.5;
        ctx.save();
        ctx.rotate(swingAngle - Math.PI / 4);
        
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(-25, -3, 15, 6);
        
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(-10, -6, 4, 12);
        
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect(-6, -2, 60, 4);
        
        ctx.restore();
    }
    
    ctx.restore();
}

// ASSETS yükleme
async function loadAssets() {
    return new Promise((resolve) => {
        const assetsToLoad = [
            { name: 'player', src: '/pixilart-drawing.png' }
        ];
        
        let loadedCount = 0;
        
        assetsToLoad.forEach(asset => {
            const img = new Image();
            img.src = asset.src;
            img.onload = () => {
                ASSETS[asset.name] = img;
                loadedCount++;
                if (loadedCount === assetsToLoad.length) resolve();
            };
            img.onerror = () => {
                console.warn(`${asset.name} yüklenemedi`);
                loadedCount++;
                if (loadedCount === assetsToLoad.length) resolve();
            };
        });
    });
}

// Başlatma
async function init() {
    await loadAssets();
    resize();
    createBushes();
    spawnInitialMaterials();
    
    // Input event'lerini bağla
    window.addEventListener("keydown", e => keys[e.code] = true);
    window.addEventListener("keyup", e => keys[e.code] = false);
    window.addEventListener("resize", resize);
    
    animate();
}

// Sayfa yüklendiğinde başlat
window.addEventListener('load', init);