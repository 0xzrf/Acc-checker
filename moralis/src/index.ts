import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";

require('dotenv').config()

Moralis.start({
    apiKey: process.env.MORALIS_API_KEY
})


async function streams() {
    const option = {
        chains: [EvmChain.SEPOLIA],
        description : "Listen to events",
        tag: "transfer",
        includeContractLogs: false,
        includeNativeTxs: true, 
        webhookUrl: "https://0074-103-247-52-249.ngrok-free.app/webhook"
    }

    const newStream = await Moralis.Streams.add(option);

    const {id} = newStream.toJSON();

    const addr = '0x51a8063E5Fd11454a371A74226156953DD291958'

    await Moralis.Streams.addAddress({address: addr, id})

    console.log("Finalized")
}

streams()