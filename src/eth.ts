import express from "express"
import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import {ethers} from "ethers";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient()
const app = express()
const port = 3000;

app.use(express.json())

//@ts-ignore
app.post("/webhook", async (req: Request, res: Response) => {
    const {body} = req;
    console.log("Started")
    try {
        console.log(body.txs[0].fromAddress,body.txs[0].toAddress, body.txs[0].value )

        await prisma.txnHistory.create({
            data: {
                from: body.txs[0].fromAddress,
                to: body.txs[0].toAddress,
                amount: parseInt(body.txs[0].value.slice(0,5))
            }
        })

    }catch(err) {
        console.log(err)
        return res.status(200).json()
    }
    return res.status(200).json()
})

//@ts-ignore
app.get("/hello", async (req: Request, res: Response) => {

    return res.json({msg: "Hello world"})
})

app.listen(port, () => {
    console.log("Listened to stream")
})