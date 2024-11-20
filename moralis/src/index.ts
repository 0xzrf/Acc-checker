import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

require('dotenv').config()

console.log(process.env.MORALIS_API_KEY);

Moralis.start({
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjM2MDcwMzcxLTE4NjQtNGI4ZC04ZGEyLWVlYmQxYjU1ODA5NSIsIm9yZ0lkIjoiNDE2ODg1IiwidXNlcklkIjoiNDI4NTQyIiwidHlwZUlkIjoiYTQ4OWVlOTgtYTRjZS00OGRjLTgyZDUtNDc5OTQ5MjM4NjUxIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MzIwNzg0NzQsImV4cCI6NDg4NzgzODQ3NH0.m5EKVunisvup44lha1XXULHnHtbPaRyyEmbKaU1u1Gw"
})


async function streams() {
    const option = {
        chains: [EvmChain.SEPOLIA],
        description : "Listen to events",
        tag: "transfer",
        includeContractLogs: false,
        includeNativeTxs: true, 
        webhookUrl: "https://58b9-103-247-52-107.ngrok-free.app/webhook"
    }

    const newStream = await Moralis.Streams.add(option);

    const {id} = newStream.toJSON();

    const addr = '0x51a8063E5Fd11454a371A74226156953DD291958'

    await Moralis.Streams.addAddress({address: addr, id})

    console.log("Finalized")
}

streams()