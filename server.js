const express = require('express');
const app = express();
app.use(express.json());

// Target 21 Insider Wallets
const INSIDER_WALLETS = new Set([
  "CUHBzSPSaNS3tArEtM3maSV6pNdJhHJFYZpurPPK9P7H",
  "HbCxe8yWQJWnK3f3FX4oohgm87FZuPYD4Ydszqxgkwft",
  "8oQoMhfBQnRspn7QtNAq2aPThRE4q94kLSTwaaFQvRgs",
  "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51",
  "6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2",
  "2T5NgDDidkvhJQg8AHDi74uCFwgp25pYFMRZXBaCUNBH",
  "6UwCF9JCEPRFfBKibwAoyuEZukLwzATiWRjiGnH1Eass",
  "922VvmmYDHV9KMTJJ71Y5Yd3Vn7cfJuFasLNSsZPygrG",
  "7tiRXPM4wwBMRMYzmywRAE6jveS3gDbNyxgRrEoU6RLA",
  "F5jWYuiDLTiaLYa54D88YbpXgEsA6NKHzWy4SN4bMYjt",
  "gasAx5Y917MYdmdnwiomwYDhmDKNGDJnN1MmEbxVdVw",
  "4bgyVZgsau9wkim1H2bhhuGBj41ZXgqMzAUYjkDGQQta",
  "8HH3M6SfUCC9yGM3ytaFQWnDc19tSBYCNJBnqeWaQ8Xb",
  "GwXhn6ctK56xZMQB2cH2t98L4ZepcrJE1SRZC97xDQvu",
  "25SoCzVFK3ihaJjaJCk6damz5PdwC6W2hP5yGQxPfFgG",
  "5zCKhBtP1d9WmnwoAYdmkPV6FxB8NEeHDkopSrXYxHpf",
  "6Rcq844rw69itEAYMamyVJYCKYio67EtpNcFw6SdqjFL",
  "HdS4GYKCxxP8sa1ViKMyRrNC4nB2p2MCeibgs2B5w4ku",
  "DNsh1UfJdxmze6T6GV9QK5SoFm7HsM5TRNxVuwVgo8Zj",
  "5YRgrP3mjGzrzirYYN5HAQH19cTYREYwGxW6XRJQUzij",
  "GM7Hrz2bDq33ezMtL6KGidSWZXMWgZ6qBuugkb5H8NvN"
]);

// Memory store for tracking cluster buys in time windows
const clusterTracker = {}; 
const CLUSTER_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

app.get('/', (req, res) => {
  res.send('Insider Cluster Bot Server is Live!');
});

// Endpoint that receives webhooks from Helius
app.post('/helius-webhook', (req, res) => {
  const events = req.body;

  if (Array.isArray(events)) {
    events.forEach(event => {
      const wallet = event.feePayer;
      
      // Check if transaction was triggered by one of your 21 wallets
      if (INSIDER_WALLETS.has(wallet)) {
        const tokenTransfer = event.tokenTransfers?.[0];
        if (tokenTransfer && tokenTransfer.mint) {
          const tokenMint = tokenTransfer.mint;
          registerTrade(wallet, tokenMint);
        }
      }
    });
  }

  res.status(200).send('OK');
});

function registerTrade(wallet, tokenMint) {
  const now = Date.now();
  if (!clusterTracker[tokenMint]) {
    clusterTracker[tokenMint] = [];
  }

  // Clear trades older than 3 minutes
  clusterTracker[tokenMint] = clusterTracker[tokenMint].filter(
    item => now - item.timestamp < CLUSTER_WINDOW_MS
  );

  // Register wallet if not already counted in this window
  if (!clusterTracker[tokenMint].some(item => item.wallet === wallet)) {
    clusterTracker[tokenMint].push({ wallet, timestamp: now });
  }

  const clusterCount = clusterTracker[tokenMint].length;
  console.log(`[TRADE DETECTED] Wallet: ${wallet} bought ${tokenMint} (Cluster size: ${clusterCount})`);

  // Trigger alert if 2 or more wallets buy the same token
  if (clusterCount >= 2) {
    console.log(`🚀 [PUMP ALERT] Token ${tokenMint} bought by ${clusterCount} insider wallets!`);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
