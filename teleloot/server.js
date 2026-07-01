require("dotenv").config();

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

    catch (e) {

        console.log(e);

        res.status(500).json({

            success: false

        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server started on ${PORT}`);

});

bot.launch();
