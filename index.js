const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory store (replace with DB later)
const users = [];
const accounts = [];
const balances = {};

// SIGNUP
app.post("/signup", (req, res) => {
  const { handle, password } = req.body;

  if (users.find(u => u.handle === handle)) {
    return res.status(400).json({ error: "Handle already exists" });
  }

  const id = Date.now().toString();
  users.push({ id, handle, password });

  const accId = "acc-" + id;
  accounts.push({ id: accId, userId: id, type: "checking" });
  balances[accId] = 0;

  res.json({ ok: true });
});

// LOGIN (checks password)
app.post("/login", (req, res) => {
  const { handle, password } = req.body;

  const user = users.find(u => u.handle === handle && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ ok: true });
});

// TRANSFER (mint has infinite funds, others cannot overdraft)
app.post("/transfer", (req, res) => {
  const { fromAcc, toHandle, amount } = req.body;

  const fromAccount = accounts.find(a => a.id === fromAcc);
  if (!fromAccount) return res.status(400).json({ error: "Invalid source account" });

  const fromUser = users.find(u => u.id === fromAccount.userId);
  const toUser = users.find(u => u.handle === toHandle);
  if (!toUser) return res.status(400).json({ error: "Recipient not found" });

  const toAcc = accounts.find(a => a.userId === toUser.id);

  const isMint = fromUser.handle === "mint";

  if (!isMint) {
    if (balances[fromAcc] < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    balances[fromAcc] -= amount;
  }

  balances[toAcc.id] += amount;

  res.json({ ok: true });
});

// FAUCET (gives 100 cR)
app.post("/faucet", (req, res) => {
  const { handle } = req.body;

  const user = users.find(u => u.handle === handle);
  if (!user) return res.status(400).json({ error: "User not found" });

  const acc = accounts.find(a => a.userId === user.id);
  balances[acc.id] += 100;

  res.json({ ok: true, balance: balances[acc.id] });
});

// GET ACCOUNTS
app.get("/accounts/:handle", (req, res) => {
  const user = users.find(u => u.handle === req.params.handle);
  if (!user) return res.status(404).json({ error: "User not found" });

  const accs = accounts.filter(a => a.userId === user.id);
  res.json(accs.map(a => ({ ...a, balance: balances[a.id] })));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

