//@ts-nocheck
import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js"
import { PrismaClient } from "@prisma/client"
import wallet from '../wallet.json'

const prisma = new PrismaClient()
const WSS_ENDPOINT = "wss://methodical-empty-uranium.solana-devnet.quiknode.pro/ea21dc04d9b4a2ab6c812dfdcaeac266f1161fb7"
const HTTP_ENDPOINT = 'https://methodical-empty-uranium.solana-devnet.quiknode.pro/ea21dc04d9b4a2ab6c812dfdcaeac266f1161fb7'

const solanaConnection = new Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT })
const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}


(async () => {
    const connection = new Connection(clusterApiUrl('devnet'))
    const walletAddr = Keypair.fromSecretKey(new Uint8Array(wallet))
    const ourWallet = new PublicKey("FSYSxnriBaN52LmMX8g8oVN3QAgxudmiBFxKGbpCFGWi")
    const creatorWallet = new PublicKey("2g46ZtgQYW1uBMDfpzaQmTtGkJJuLNTXFoA7XLYAX7rZ")
    const agentWallet = new PublicKey("9R3b8inAJvnvzAp7oZucQzDzGuWXJQBxg4sABA8D4Koj")

    const accInfo = await solanaConnection.getAccountInfo(walletAddr.publicKey);

    const accAmt = accInfo?.lamports
    const subscribe = await solanaConnection.onAccountChange(walletAddr.publicKey,
        async (update) => {
            console.log(`--- Event   Notification for ${walletAddr.publicKey.toString()}-- -\n New Account Balance ${update.lamports / LAMPORTS_PER_SOL}`)
            try {

                const signature = await solanaConnection.getSignaturesForAddress(new PublicKey(walletAddr.publicKey));
                const transactions = []
                for (const sig of signature) {
                    const transaction = await solanaConnection.getTransaction(sig.signature, {
                        maxSupportedTransactionVersion: 0
                    });
                    solanaConnection.getTransactionCount
                    transactions.push(transaction);
                }


                if (new PublicKey(transactions[0]?.transaction.message.accountKeys[1].toString() as string).toString() == walletAddr.publicKey.toString()) {
                    //@ts-ignore
                    const amount = update.lamports - accAmt as number
                    await prisma.txnHistory.create({
                        data: {
                            //@ts-ignore
                            amount,
                            from: transactions[0]?.transaction.message.accountKeys[0].toString() as string,
                            to: transactions[0]?.transaction.message.accountKeys[1].toString() as string,
                        }
                    })

                    const txn = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: walletAddr.publicKey,
                            toPubkey: ourWallet,
                            lamports: amount * 0.15 //15% to our wallet
                        })
                    )
                        .add(
                            SystemProgram.transfer({
                                fromPubkey: walletAddr.publicKey,
                                toPubkey: creatorWallet,
                                lamports: amount * 0.1 // Sending 10% of the transaction to the agent's creator wallet
                            }),
                        )
                        .add(
                            SystemProgram.transfer({
                                fromPubkey: walletAddr.publicKey,
                                toPubkey: agentWallet,
                                lamports: amount * 0.75 // Sending 75% of the transaction to the agent wallet
                            })
                        )

                    txn.feePayer = walletAddr.publicKey;
                    const recentBlockhas = await connection.getLatestBlockhash()
                    txn.recentBlockhash = recentBlockhas.blockhash;
                    txn.sign(walletAddr)
                    try {
                        await sendAndConfirmTransaction(connection, txn, [walletAddr])
                        console.log("Transaction done")
                    } catch (err) {
                        console.error("Error", err)
                    }
                }
            } catch (error) {
                console.log(error);
                return null;
            }


        })
    console.log("Starting web socket, subscription ID", subscribe);



    await sleep(1000000);

    await solanaConnection.removeAccountChangeListener(subscribe);
    console.log(`WebSocket id: ${subscribe} closed`)
})()