"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"));
const monitorAdd = new web3_js_1.PublicKey("9R3b8inAJvnvzAp7oZucQzDzGuWXJQBxg4sABA8D4Koj");
connection.onAccountChange(monitorAdd, (update) => {
    console.log(update);
});
