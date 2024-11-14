import {Connection, PublicKey, LAMPORTS_PER_SOL} from "@solana/web3.js"
import { PrismaClient } from "@prisma/client"


const prisma = new PrismaClient()
const WSS_ENDPOINT = "wss://methodical-empty-uranium.solana-devnet.quiknode.pro/ea21dc04d9b4a2ab6c812dfdcaeac266f1161fb7"
const HTTP_ENDPOINT = 'https://methodical-empty-uranium.solana-devnet.quiknode.pro/ea21dc04d9b4a2ab6c812dfdcaeac266f1161fb7'

const solanaConnection = new Connection(HTTP_ENDPOINT, {wsEndpoint: WSS_ENDPOINT})
const sleep = (ms: number) => {
    return new Promise(resolve=> setTimeout(resolve, ms))
}

(async () => {
    const Acc = new PublicKey("9R3b8inAJvnvzAp7oZucQzDzGuWXJQBxg4sABA8D4Koj")
    const accInfo = await solanaConnection.getAccountInfo(Acc);

    const accAmt = accInfo?.lamports
    const subscribe = await solanaConnection.onAccountChange(Acc, 
        async (update) => {
            console.log(`---Event   Notification for ${Acc.toString()}---\n New Account Balance`, update.lamports / LAMPORTS_PER_SOL)
            try {
                const signature = await solanaConnection.getSignaturesForAddress(new PublicKey(Acc));
        
                const transactions = []
                for (const sig of signature) {
                    const transaction = await solanaConnection.getTransaction(sig.signature);
                    // console.log(transaction?.transaction.message.accountKeys)
                    transactions.push(transaction);
                }
        
                console.log("From: ", transactions[0]?.transaction.message.accountKeys[0].toString(), "To", transactions[0]?.transaction.message.accountKeys[1].toString())

                await prisma.txnHistory.create({
                    data: {
                        //@ts-ignore
                        amount:  update.lamports - accAmt as number,
                        from: transactions[0]?.transaction.message.accountKeys[0].toString() as string,
                        to : transactions[0]?.transaction.message.accountKeys[1].toString() as string,
                    }
                })

            } catch (error) {
                console.log(error);
                return null;
            }


    })  
    console.log("Starting web socket, subscription ID" , subscribe);



    await sleep(1000000);

    await solanaConnection.removeAccountChangeListener(subscribe);
    console.log(`WebSocket id: ${subscribe} closed`)
})()