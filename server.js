const Database = require("better-sqlite3");

const db = new Database("teleloot.db");
/* ===========================
   INIT DB
=========================== */

db.prepare(`
CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    name TEXT,
    rarity TEXT,
    price INTEGER,
    image TEXT,
    createdAt INTEGER
)
`).run();
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
)
`).run();
function ensureUser(userId) {

    const user = db.prepare(`
        SELECT * FROM users WHERE userId = ?
    `).get(userId);

    if (!user) {

        db.prepare(`
            INSERT INTO users (userId, balance)
            VALUES (?, 1000)
        `).run(userId);

        return { userId, balance: 1000 };
    }

    return user;
}


const express = require("express");
const { Telegraf } = require("telegraf");
const path = require("path");

const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.log("BOT_TOKEN отсутствует");
    process.exit();
}

const bot = new Telegraf(BOT_TOKEN);

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

bot.start(async (ctx) => {

    const appUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : "https://railway.app";

    await ctx.reply("🎁 Добро пожаловать в TeleLoot!", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "🎰 Открыть TeleLoot",
                        web_app: {
                            url: appUrl
                        }
                    }
                ]
            ]
        }
    });

});

bot.on("pre_checkout_query", async (ctx) => {

    await ctx.answerPreCheckoutQuery(true);

});

app.post("/create-invoice", async (req, res) => {

    try {

        const { userId } = req.body;

        const invoiceLink = await bot.telegram.createInvoiceLink({

            title: "TeleLoot",

            description: "Открытие кейса",

            payload: `case_${userId}_${Date.now()}`,

            provider_token: "",

            currency: "XTR",

            prices: [

                {
                    label: "Кейс",
                    amount: 99
                }

            ]

        });

        res.json({

            success: true,

            invoiceLink

        });

    }
/* ===========================
   SPIN CASE ENDPOINT
=========================== */

app.post("/spin-case", (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {

            return res.json({
                success: false,
                error: "no_user"
app.post("/create-invoice", async (req, res) => {

    try {

        const { userId } = req.body;

        const invoiceLink = await bot.telegram.createInvoiceLink({

            title: "TeleLoot",

            description: "Открытие кейса",

            payload: `case_${userId}_${Date.now()}`,

            provider_token: "",

            currency: "XTR",

            prices: [

                {

                    label: "Кейс",

                    amount: 99

                }

            ]

        });

        res.json({

            success: true,

            invoiceLink

        });

    }

    catch (e) {

        console.log(e);

        res.status(500).json({

            success: false

        });

    }

});

app.post("/spin-case", (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {

            return res.json({

                success: false,

                error: "no_user"

            });

        }

        const user = ensureUser(userId);

        const CASE_PRICE = 99;

        if (user.balance < CASE_PRICE) {

            return res.json({

                success: false,

                error: "not_enough_balance"

            });

        }

        const win = getWeightedGift();

        const balance = user.balance - CASE_PRICE + win.price;

        db.prepare(`
            UPDATE users
            SET balance = ?
            WHERE userId = ?
        `).run(balance, userId);

        db.prepare(`
            INSERT INTO inventory
            (
                userId,
                name,
                rarity,
                price,
                image,
                createdAt
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(

            userId,
            win.name,
            win.rarity,
            win.price,
            win.image,
            Date.now()

        );

        res.json({

            success: true,

            gift: win,

            balance

        });

    }

    catch (e) {

        console.log(e);

        res.status(500).json({

            success: false

        });

    }

});

app.listen(PORT, () => {

    console.log(`Server started on ${PORT}`);

});

bot.launch();

/* ===========================
   CASE CONFIG (SERVER SIDE)
=========================== */

const gifts = [

{
    id: 1,
    name: "Scared Cat",
    rarity: "epic",
    price: 980,
    image: "/assets/RVFBVHVVR2R2cmpMdlRXRTVwcFZGT1ZDcVUyZGxDTFVuS1RzdTBuMUpZbTlsYTEw.webp",
    weight: 20
},

{
    id: 2,
    name: "Precious Peach",
    rarity: "rare",
    price: 1200,
    image: "/assets/RVFBNGk1OGl1UzlEVVlSdFVaOTdzWm81bW5rYmlZVUJwV1hRT2UzZEVVQ2NQMVc4.webp",
    weight: 25
},

{
    id: 3,
    name: "Artisan Brick",
    rarity: "uncommon",
    price: 450,
    image: "/assets/RVFBMlJJN1h2SXM5d0pRS3J4a1RiN1l0cGVVdWFELXAwZVQ1dUJlNGJrY0dUMmJk.webp",
    weight: 35
},

{
    id: 4,
    name: "Vintage Cigar",
    rarity: "rare",
    price: 750,
    image: "/assets/RVFBQ2NRcFIyZm1kZUVOV2RFMllHUVdIVnhTVHlBOFpxNF9rN3JrX0lheENSWE5l.webp",
    weight: 15
},

{
    id: 5,
    name: "Snoop Cigar",
    rarity: "legendary",
    price: 2400,
    image: "/assets/RVFBNzJVZXZyX01IdnpZd1NDSEpVSy11QzZrZC13OGtieHpoSjQ5V0lpRy1vNkNE.webp",
    weight: 5
}

];

/* ===========================
   WEIGHTED RANDOM (SERVER)
=========================== */

function getWeightedGift() {

    const pool = [];

    for (const gift of gifts) {

        for (let i = 0; i < gift.weight; i++) {

            pool.push(gift);

        }

    }

    return pool[Math.floor(Math.random() * pool.length)];

}

app.post("/inventory", (req, res) => {

    try {

        const { userId } = req.body;

        const items = db.prepare(`
            SELECT * FROM inventory
            WHERE userId = ?
            ORDER BY id DESC
        `).all(userId);

        res.json({
            success: true,
            items
        });

    }

    catch (e) {

        console.log(e);

        res.status(500).json({
            success: false
        });

    }

});

/* ===========================
   UPGRADE SYSTEM (SERVER)
=========================== */

function getItemByName(name) {

    return gifts.find(g => g.name === name);

}

app.post("/upgrade", (req, res) => {

    try {

        const { userId, itemName, targetName } = req.body;

        if (!userId || !itemName || !targetName) {

            return res.status(400).json({ success: false });

        }

        const item = getItemByName(itemName);

        const target = getItemByName(targetName);

        if (!item || !target) {

            return res.status(404).json({ success: false });

        }

        // шанс апгрейда зависит от цены
        let chance = item.price / target.price;

        if (chance > 0.9) chance = 0.9;
        if (chance < 0.05) chance = 0.05;

        const roll = Math.random();

        const success = roll < chance;

        res.json({

            success: true,

            result: success ? target : null,

            successChance: chance

        });

    }

    catch (e) {

        console.log(e);

        res.status(500).json({ success: false });

    }

});
