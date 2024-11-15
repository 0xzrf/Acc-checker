import websockets
import asyncio
import json
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bitcoin_transactions.log'),
        logging.StreamHandler()
    ]
)

class BitcoinTransactionMonitor:
    def __init__(self, bitcoin_address):
        self.ws_url = "wss://ws.blockchain.info/inv"
        self.bitcoin_address = bitcoin_address
        self.running = False
    
    async def connect(self):
        """Establish WebSocket connection and subscribe to address"""
        try:
            self.websocket = await websockets.connect(self.ws_url)

            await self.websocket.send(json.dumps({
                "op": "addr_sub",
                "addr": self.bitcoin_address
            }))
            logging.info(f"Successfully subscribed to address: {self.bitcoin_address}")
            return True
        except Exception as e:
            logging.error(f"Connection error: {str(e)}")
            return False

    def format_transaction(self, tx):
        """Format transaction data for logging"""
        inputs = []
        outputs = []
        
        for inp in tx['inputs']:
            if 'prev_out' in inp and 'addr' in inp['prev_out']:
                inputs.append({
                    'address': inp['prev_out']['addr'],
                    'value': inp['prev_out']['value'] / 100000000  
                })
        
        for out in tx['out']:
            outputs.append({
                'address': out['addr'],
                'value': out['value'] / 100000000 
            })

        return {
            'hash': tx['hash'],
            'time': datetime.fromtimestamp(tx['time']).strftime('%Y-%m-%d %H:%M:%S'),
            'inputs': inputs,
            'outputs': outputs,
            'size': tx['size'],
        }

    async def process_message(self, message):
        """Process incoming WebSocket messages"""
        data = json.loads(message)
        
        if data['op'] == 'utx':
            tx = self.format_transaction(data['x'])
            logging.info("New transaction detected:")
            logging.info(f"Hash: {tx['hash']}")
            logging.info(f"Time: {tx['time']}")
            logging.info("Inputs:")
            for inp in tx['inputs']:
                logging.info(f"  {inp['address']}: {inp['value']} BTC")
            logging.info("Outputs:")
            for out in tx['outputs']:
                logging.info(f"  {out['address']}: {out['value']} BTC")
            logging.info(f"Size: {tx['size']} bytes")
            logging.info("-" * 80)

    async def keep_alive(self):
        """Send periodic ping to keep connection alive"""
        while self.running:
            try:
                await self.websocket.send(json.dumps({"op": "ping"}))
                await asyncio.sleep(30) 
            except Exception as e:
                logging.error(f"Ping error: {str(e)}")
                break

    async def monitor(self):
        """Main monitoring loop"""
        self.running = True
        
        while self.running:
            try:
                if not self.websocket or self.websocket.closed:
                    success = await self.connect()
                    if not success:
                        await asyncio.sleep(5) 
                        continue

                keep_alive_task = asyncio.create_task(self.keep_alive())
                
                while self.running and not self.websocket.closed:
                    message = await self.websocket.recv()
                    await self.process_message(message)
                    
            except websockets.exceptions.ConnectionClosed:
                logging.warning("Connection closed. Reconnecting...")
                await asyncio.sleep(5)
            except Exception as e:
                logging.error(f"Error in monitor loop: {str(e)}")
                await asyncio.sleep(5)
            finally:
                if 'keep_alive_task' in locals():
                    keep_alive_task.cancel()

    def stop(self):
        """Stop the monitor"""
        self.running = False

async def main():
    # It's my BTC address for now
    bitcoin_address = "tb1qug5djyats85fu73ft677qh3ygz97g9r25ap9gt"
    
    monitor = BitcoinTransactionMonitor(bitcoin_address)
    
    try:
        await monitor.monitor()
    except KeyboardInterrupt:
        monitor.stop()
        logging.info("Monitoring stopped by user")

if __name__ == "__main__":
    asyncio.run(main())