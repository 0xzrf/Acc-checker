import express from "express"
import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import {ethers, Wallet} from "ethers";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient()
const app = express()
const port = 3000;

app.use(express.json())

const WALLETS = {
    creator: "0x752f6923b4eB9D4d742AA706fD100BB0bE9D26A5",
    agent: "FXgHYnZFbzGGaQtUc2wchCQHQphnKVrPZkEKpuwbSH3a",
    our: "0x752f6923b4eB9D4d742AA706fD100BB0bE9D26A5"
  }
  
const FEE_DISTRIBUTION = {
    our: 0.15,    // 15%
    agent: 0.75,  // 75%
    creator: 0.10 // 10%  
}
  
interface Transaction {
    to: string
    value: bigint
}

async function signAndSendTransaction(
    signer: ethers.Wallet,
    transaction: Transaction
): Promise<ethers.TransactionResponse> {
    // Get the current gas price
    const gasPrice = await signer.provider!.getFeeData()
    
    // Prepare the transaction
    const tx = {
      to: transaction.to,
      value: transaction.value,
      gasPrice: gasPrice.gasPrice,
      gasLimit: 21000, // Standard gas limit for ETH transfers
      nonce: await signer.getNonce()
    }
    console.log("Transaction happened")
  
    // Sign and send the transaction
    try {
      const signedTx = await signer.sendTransaction(tx)
      await signedTx.wait() 
      return signedTx
    } catch (error) {
      console.error(`Transaction failed: ${error}`)
      throw error
    }
}
  

//@ts-ignore
app.post("/webhook", async (req: Request, res: Response) => {
    try {
    const {body} = req;
    console.log(body)

    const inputValue =  BigInt(body.txs[0].value);

    
    const provider = new ethers.JsonRpcProvider(process.env.QUICKNODE_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

    const distributions = [
        { to: WALLETS.our, value: (inputValue * BigInt(FEE_DISTRIBUTION.our * 100)) / BigInt(100) },
        { to: WALLETS.agent, value: (inputValue * BigInt(FEE_DISTRIBUTION.agent * 100)) / BigInt(100) },
        { to: WALLETS.creator, value: (inputValue * BigInt(FEE_DISTRIBUTION.creator * 100)) / BigInt(100) }
    ]

    const txPromises = distributions.map(async (dist, index) => {
        try {
          const tx = await signAndSendTransaction(signer, dist)
          console.log(`Transaction ${index + 1} hash:`, tx.hash)
          return tx
        } catch (error) {
          console.error(`Failed to send transaction ${index + 1}:`, error)
          return res.status(200).json()
        }
    })

    await Promise.all(txPromises)

    // Store transaction in database
    await prisma.txnHistory.create({
      data: {
        from: body.txs[0].fromAddress,
        to: body.txs[0].toAddress,
        amount: Number(body.txs[0].value)
      }
    })

    return res.status(200).json({ success: true })
    }catch(err) {
        console.log(err)
        return res.status(200).json()
    }
   
})

//@ts-ignore
app.get("/hello", async (req: Request, res: Response) => {

    return res.json({msg: "Hello world"})
})

app.listen(port, () => {
    console.log("Listened to stream")
})