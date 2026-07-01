const express = require("express");
const { Telegraf } = require("telegraf");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error("BOT_TOKEN отсутствует");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const db = new Database("teleloot.db");

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});
db.exec(`

CREATE TABLE IF NOT EXISTS users (

    userId TEXT PRIMARY KEY,

    balance INTEGER DEFAULT 1000

);

CREATE TABLE IF NOT EXISTS inventory (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    userId TEXT,

    name TEXT,

    rarity TEXT,

    price INTEGER,

    image TEXT,

    createdAt INTEGER

);

CREATE TABLE IF NOT EXISTS payments (

    payload TEXT PRIMARY KEY,

    userId TEXT,

    paid INTEGER DEFAULT 0,

    used INTEGER DEFAULT 0,

    createdAt INTEGER

);

`);
function ensureUser(userId){

    let user=db.prepare(`
        SELECT *
        FROM users
        WHERE userId=?
    `).get(userId);

    if(!user){

        db.prepare(`
            INSERT INTO users(userId,balance)
            VALUES(?,1000)
        `).run(userId);

        user={
            userId,
            balance:1000
        };

    }

    return user;

}
function createPayment(payload,userId){

    db.prepare(`
        INSERT INTO payments
        (payload,userId,createdAt)
        VALUES(?,?,?)
    `).run(
        payload,
        userId,
        Date.now()
    );

}

function markPaymentPaid(payload){

    db.prepare(`
        UPDATE payments
        SET paid=1
        WHERE payload=?
    `).run(payload);

}

function consumePayment(payload){

    db.prepare(`
        UPDATE payments
        SET used=1
        WHERE payload=?
    `).run(payload);

}

function getPayment(payload){

    return db.prepare(`
        SELECT *
        FROM payments
        WHERE payload=?
    `).get(payload);

}
/* ===========================
   TELEGRAM STARS PAYMENT
=========================== */

bot.on("pre_checkout_query", async (ctx) => {
    try {
        await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
        console.error(err);
    }
});

bot.on("successful_payment", async (ctx) => {
    try {
        const userId = String(ctx.from.id);

        ensureUser(userId);

        const CASE_PRICE = 99;

        db.prepare(`
            UPDATE users
            SET balance = balance + ?
            WHERE userId = ?
        `).run(CASE_PRICE, userId);

        await ctx.reply(
            `⭐ Оплата прошла успешно!\n\nНа ваш баланс начислено ${CASE_PRICE} Stars.`
        );

    } catch (err) {
        console.error("successful_payment:", err);
    }
});

app.post("/create-invoice", async (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "no_user"
            });
        }

        const invoiceLink = await bot.telegram.createInvoiceLink({

            title: "TeleLoot Case",

            description: "Пополнение баланса на 99 Stars",

            payload: `stars_${userId}_${Date.now()}`,

            provider_token: "",

            currency: "XTR",

            prices: [
                {
                    label: "99 Stars",
                    amount: 99
                }
            ]

        });

        return res.json({
            success: true,
            invoiceLink
        });

    } catch (err) {

        console.error("createInvoice:", err);

        return res.status(500).json({
            success: false
        });

    }

});
