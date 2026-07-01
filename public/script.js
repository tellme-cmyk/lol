/* ===========================
   TELELOOT v2 SCRIPT
   PART 1 / 6
=========================== */

const tg = window.Telegram?.WebApp || null;

if (tg) {
    tg.ready();
    tg.expand();
}

const state = {

    spinning: false,

    user: null,

    inventory: []

};

/* ===========================
   ELEMENTS
=========================== */

const openButton = document.getElementById("openButton");
const rouletteTrack = document.getElementById("rouletteTrack");

const winCard = document.getElementById("winCard");
const winImage = document.getElementById("winImage");
const winName = document.getElementById("winName");
const winPrice = document.getElementById("winPrice");
const winRarity = document.getElementById("winRarity");

const againButton = document.getElementById("againButton");

/* ===========================
   GIFTS CONFIG (TEMP LOCAL)
   (позже вынесем на сервер)
=========================== */

const gifts = [

{
    id: 1,
    name: "Scared Cat",
    rarity: "epic",
    price: 980,
    image: "/assets/RVFBVHVVR2R2cmpMdlRXRTVwcFZGT1ZDcVUyZGxDTFVuS1RzdTBuMUpZbTlsYTEw.webp"
},

{
    id: 2,
    name: "Precious Peach",
    rarity: "rare",
    price: 1200,
    image: "/assets/RVFBNGk1OGl1UzlEVVlSdFVaOTdzWm81bW5rYmlZVUJwV1hRT2UzZEVVQ2NQMVc4.webp"
},

{
    id: 3,
    name: "Artisan Brick",
    rarity: "uncommon",
    price: 450,
    image: "/assets/RVFBMlJJN1h2SXM5d0pRS3J4a1RiN1l0cGVVdWFELXAwZVQ1dUJlNGJrY0dUMmJk.webp"
},

{
    id: 4,
    name: "Vintage Cigar",
    rarity: "rare",
    price: 750,
    image: "/assets/RVFBQ2NRcFIyZm1kZUVOV2RFMllHUVdIVnhTVHlBOFpxNF9rN3JrX0lheENSWE5l.webp"
},

{
    id: 5,
    name: "Snoop Cigar",
    rarity: "legendary",
    price: 2400,
    image: "/assets/RVFBNzJVZXZyX01IdnpZd1NDSEpVSy11QzZrZC13OGtieHpoSjQ5V0lpRy1vNkNE.webp"
}

];

/* ===========================
   INIT
=========================== */

function init() {

    if (tg && tg.initDataUnsafe?.user) {

        state.user = tg.initDataUnsafe.user;

    }

    createRouletteItems();

    bindEvents();

}

init();

/* ===========================
   CREATE ROULETTE ITEMS
=========================== */

function createRouletteItems() {

    rouletteTrack.innerHTML = "";

    // временно создаём длинную ленту
    // позже сделаем серверную генерацию

    for (let i = 0; i < 30; i++) {

        const gift = gifts[Math.floor(Math.random() * gifts.length)];

        const item = document.createElement("div");

        item.className = "roulette-item";

        item.innerHTML = `

            <img src="${gift.image}" />

        `;

        rouletteTrack.appendChild(item);

    }

}

/* ===========================
   EVENTS
=========================== */

function bindEvents() {

    openButton.addEventListener("click", openCase);

    againButton.addEventListener("click", reset);

}

function reset() {

    winCard.classList.add("hidden");

    createRouletteItems();

}
/* ===========================
   SPIN SYSTEM
=========================== */


async function openCase() {

    if (state.spinning) return;

    state.spinning = true;

    openButton.disabled = true;

    winCard.classList.add("hidden");

    try {

        const userId = state.user?.id || 0;

        // 👉 получаем ЧЕСТНЫЙ выигрыш с сервера
        const res = await fetch("/spin-case", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({ userId })

        });

        const data = await res.json();

        if (!data.success) {

            throw new Error("server error");

        }

        startSpin(data.gift);

    }

    catch (e) {

        console.log(e);

        // fallback
        startSpin(gifts[Math.floor(Math.random() * gifts.length)]);

    }

}

/* ===========================
   MAIN SPIN LOGIC
=========================== */


function startSpin(winGift) {

    const itemWidth = 130;

    const total = 40;

    const winPosition = 28; // ближе к центру

    rouletteTrack.innerHTML = "";

    // создаём ленту с гарантированным выигрышем
    for (let i = 0; i < total; i++) {

        const gift = (i === winPosition)
            ? winGift
            : gifts[Math.floor(Math.random() * gifts.length)];

        const el = document.createElement("div");

        el.className = "roulette-item";

        el.innerHTML = `<img src="${gift.image}" />`;

        rouletteTrack.appendChild(el);

    }

    const centerOffset = window.innerWidth / 2 - itemWidth / 2;

    const target = winPosition * itemWidth - centerOffset;

    let pos = 0;

    let speed = 28;

    let slow = false;

    function animate() {

        pos += speed;

        rouletteTrack.style.transform = `translateX(-${pos}px)`;

        if (pos > target - 500) slow = true;

        if (slow) speed *= 0.94;

        if (speed < 2) speed = 2;

        if (pos >= target && speed <= 2.2) {

            finishSpin(winGift);

            return;

        }

        requestAnimationFrame(animate);

    }

    animate();

}

/* ===========================
   FINISH SPIN
=========================== */


function finishSpin(gift) {

    state.spinning = false;

    openButton.disabled = false;

    winImage.src = gift.image;

    winName.innerText = gift.name;

    winPrice.innerText = `⭐ ${gift.price}`;

    winRarity.innerText = gift.rarity.toUpperCase();

    winCard.className = "";

    winCard.classList.add("fade-in", gift.rarity);

    if (gift.rarity === "legendary") {

        winCard.classList.add("legendary-glow");

    }

    if (gift.rarity === "mythic") {

        winCard.classList.add("mythic-glow");

    }

    winCard.classList.remove("hidden");

}
function showWin(gift) {

    // очищаем рулетку визуально
    rouletteTrack.style.transform = "translateX(0px)";

    winImage.src = gift.image;
    winName.innerText = gift.name;
    winPrice.innerText = `⭐ ${gift.price}`;
    winRarity.innerText = gift.rarity.toUpperCase();

    // очистка старых классов редкости
    winCard.classList.remove(
        "common",
        "uncommon",
        "rare",
        "epic",
        "legendary",
        "mythic"
    );

    winCard.classList.add(gift.rarity);

    // эффекты редкости
    if (gift.rarity === "legendary") {
        winCard.classList.add("legendary-glow");
    }

    if (gift.rarity === "mythic") {
        winCard.classList.add("mythic-glow");
    }

    // показать карточку
    setTimeout(() => {

        winCard.classList.remove("hidden");

        winCard.classList.add("fade-in");

    }, 300);

}

/* ===========================
   CLEAN RESET
=========================== */

function reset() {

    winCard.classList.add("hidden");

    winCard.classList.remove("fade-in");

    openButton.disabled = false;

    state.spinning = false;

    rouletteTrack.style.transform = "translateX(0px)";

    createRouletteItems();

}

/* ===========================
   UTILS
=========================== */

// пока заглушка под серверный выигрыш
async function getServerWin() {

    // позже заменим на API:
    // const res = await fetch("/spin");
    // return await res.json();

    return gifts[Math.floor(Math.random() * gifts.length)];

}

/* ===========================
   REALISTIC ALIGNMENT SYSTEM
=========================== */

function startSpin() {

    const items = document.querySelectorAll(".roulette-item");

    const itemWidth = 120;

    const visibleCenterOffset = window.innerWidth / 2 - itemWidth / 2;

    const winIndex = Math.floor(Math.random() * gifts.length);

    // создаём длинную ленту и вставляем выигрыш ближе к центру
    rouletteTrack.innerHTML = "";

    const total = 40;

    let winPosition = 25; // фиксированная точка ближе к центру

    let winGift = gifts[winIndex];

    for (let i = 0; i < total; i++) {

        const gift = (i === winPosition)
            ? winGift
            : gifts[Math.floor(Math.random() * gifts.length)];

        const item = document.createElement("div");

        item.className = "roulette-item";

        item.style.width = "120px";

        item.style.height = "120px";

        item.innerHTML = `
            <img src="${gift.image}" />
        `;

        rouletteTrack.appendChild(item);

    }

    let position = 0;

    let speed = 30;

    let slowing = false;

    const targetOffset =
        winPosition * itemWidth - visibleCenterOffset;

    function animate() {

        position += speed;

        rouletteTrack.style.transform = `translateX(-${position}px)`;

        // начало замедления
        if (position > targetOffset - 400 && !slowing) {
            slowing = true;
        }

        if (slowing) {

            speed *= 0.95;

            if (speed < 2) speed = 2;

        }

        // остановка точно по центру
        if (position >= targetOffset && speed <= 2.2) {

            finishSpin(winIndex);

            return;

        }

        requestAnimationFrame(animate);

    }

    animate();

}

/* ===========================
   ITEM STYLE (fallback)
=========================== */

function ensureStyles() {

    const style = document.createElement("style");

    style.innerHTML = `

        .roulette {

            width:100%;

            overflow:hidden;

            position:relative;

        }

        .roulette-track {

            display:flex;

            gap:10px;

            transition:transform 0.1s linear;

            will-change:transform;

        }

        .roulette-item {

            min-width:120px;

            height:120px;

            display:flex;

            justify-content:center;

            align-items:center;

            background:rgba(255,255,255,0.05);

            border-radius:16px;

            border:1px solid rgba(255,255,255,0.08);

        }

        .roulette-item img {

            width:90px;

            height:90px;

            object-fit:contain;

        }

        .roulette-arrow {

            position:absolute;

            top:-20px;

            left:50%;

            transform:translateX(-50%);

            font-size:26px;

            color:white;

            z-index:10;

        }

    `;

    document.head.appendChild(style);

}

/* ===========================
   INIT FIX
=========================== */

ensureStyles();

/* ===========================
   INVENTORY SYSTEM
=========================== */

const inventoryBtn = document.getElementById("inventoryBtn");
const inventoryPage = document.getElementById("inventoryPage");
const inventoryGrid = document.getElementById("inventoryGrid");

inventoryBtn.addEventListener("click", openInventory);

async function openInventory() {

    inventoryPage.classList.remove("hidden");

    document.querySelector("main").style.display = "none";

    await loadInventory();

}

async function loadInventory() {

    try {

        const userId = state.user?.id || 0;

        const res = await fetch("/inventory", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({ userId })

        });

        const data = await res.json();

        inventoryGrid.innerHTML = "";

        if (!data.items || data.items.length === 0) {

            inventoryGrid.innerHTML = "<p>Инвентарь пуст</p>";

            return;

        }

        for (const item of data.items) {

            const el = document.createElement("div");

            el.className = "inv-card";

            el.innerHTML = `

                <img src="${item.image}" />

                <div class="inv-name">${item.name}</div>

                <div class="inv-price">⭐ ${item.price}</div>

                <div class="inv-rarity">${item.rarity}</div>

            `;

            inventoryGrid.appendChild(el);

        }

    }

    catch (e) {

        console.log(e);

        inventoryGrid.innerHTML = "<p>Ошибка загрузки</p>";

    }

}

/* ===========================
   CLOSE INVENTORY ON NAV
=========================== */

function closeInventory() {

    inventoryPage.classList.add("hidden");

    document.querySelector("main").style.display = "flex";

}

/* auto-bind other buttons later */

document.getElementById("openButton")
.addEventListener("click", () => {
    closeInventory();
});
