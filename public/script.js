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

function openCase() {

    if (state.spinning) return;

    state.spinning = true;

    openButton.disabled = true;

    winCard.classList.add("hidden");

    // создаём новую ленту перед прокруткой
    createRouletteItems();

    startSpin();

}

/* ===========================
   MAIN SPIN LOGIC
=========================== */

function startSpin() {

    const items = document.querySelectorAll(".roulette-item");

    const itemWidth = 120;

    const totalItems = items.length;

    // случайный выигрыш (пока клиентский)
    const winIndex = Math.floor(Math.random() * totalItems);

    const targetOffset = winIndex * itemWidth;

    let position = 0;

    let speed = 25;

    let slowDownStarted = false;

    let currentIndex = 0;

    function animate() {

        position += speed;

        rouletteTrack.style.transform = `translateX(-${position}px)`;

        currentIndex = Math.floor(position / itemWidth);

        // старт замедления
        if (position >= targetOffset - 300 && !slowDownStarted) {

            slowDownStarted = true;

        }

        // замедление
        if (slowDownStarted) {

            speed *= 0.96;

            if (speed < 2) speed = 2;

        }

        // остановка
        if (position >= targetOffset && speed <= 2) {

            finishSpin(winIndex);

            return;

        }

        requestAnimationFrame(animate);

    }

    animate();

}

/* ===========================
   FINISH SPIN
=========================== */

function finishSpin(index) {

    const gift = gifts[index % gifts.length];

    state.spinning = false;

    openButton.disabled = false;

    showWin(gift);

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
