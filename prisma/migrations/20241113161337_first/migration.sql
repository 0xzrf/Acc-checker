-- CreateTable
CREATE TABLE "TxnHistory" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "TxnHistory_pkey" PRIMARY KEY ("id")
);
