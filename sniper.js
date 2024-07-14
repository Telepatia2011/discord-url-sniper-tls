"use strict";
const tls = require("tls");
const WebSocket = require("ws");
const extractJsonFromString = require("extract-json-from-string");

let vanity;
const guilds = {};
const a = "TOKEN";
const l = "TOKEN";
const s = "SERVER ID";

const tlsSocket = tls.connect({
    host: "canary.discord.com",
    port: 443,
});

tlsSocket.on("data", async (data) => {
    const ext = await extractJsonFromString(data.toString());});

tlsSocket.on("end", (event) => {
    console.log("x");
    return process.exit();
});

tlsSocket.on("secureConnect", () => {
    const websocket = new WebSocket("wss://gateway-us-east1-b.discord.gg");

    websocket.onclose = (event) => {
        console.log(`ws connection closed ${event.reason} ${event.code}`);
        return process.exit();
    };

    websocket.onmessage = async (message) => {
        const { d, op, t } = JSON.parse(message.data);

        if (t === "GUILD_UPDATE") {
            const find = guilds[d.guild_id];
            if (find && find !== d.vanity_url_code) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write([
                    `PATCH /api/v7/guilds/${s}/vanity-url HTTP/1.1`,
                    "Host: canary.discord.com",
                    `Authorization: ${a}`,
                    "Content-Type: application/json",
                    `Content-Length: ${requestBody.length}`,
                    "",
                    "",
                ].join("\r\n") + requestBody);
            }
        }
        else if (t === "GUILD_DELETE") {
            const find = guilds[d.id];
            if (find) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write([
                    `PATCH /api/v7/guilds/${s}/vanity-url HTTP/1.1`,
                    "Host: canary.discord.com",
                    `Authorization: ${a}`,
                    "Content-Type: application/json",
                    `Content-Length: ${requestBody.length}`,
                    "",
                    "",
                ].join("\r\n") + requestBody);
                vanity = `${find} guild delete`;
            }
        }
        else if (t === "READY") {
            d.guilds.forEach((guild) => {
                if (guild.vanity_url_code) {
                    guilds[guild.id] = guild.vanity_url_code;
                }
                else {
                }
            });
            console.log(guilds);
        }

        if (op === 10) {
            websocket.send(JSON.stringify({
                op: 2,
                d: {
                    token: l,
                    intents: 1,
                    properties: {
                        os: "windows",
                        browser: "chrome",
                        device: "",
                    },
                },
            }));
            setInterval(() => websocket.send(JSON.stringify({ op: 1, d: {}, s: null, t: "heartbeat" })), d.heartbeat_interval);
        }
        else if (op === 7)
            return process.exit();
    };

    setInterval(() => {
        tlsSocket.write(["GET / HTTP/1.2", "Host: canary.discord.com", "", ""].join("\r\n"));
    }, 600);
});