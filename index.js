const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// In-memory store (replace with a real DB later)
const users = [];
const accounts = [];
const balances = {};

app.post("/signup", (req, res) => {
  const { handle, password } = req.body;
  const id = Date.now().toString();
  users.push({ id, handle, password });
  accounts.push({ id: "acc-" + id, userId: id, type: "checking" });
  balances["acc-" + id] = 0;
  res.json({ ok: true });
});

app.post("/transfer", (req, res) => {
  const { fromAcc, toHandle, amount } = req.body;
  const toUser = users.find(u => u.handle === toHandle);
  if (!toUser) return res.status(400).json({ error: "Recipient not found" });
  const toAcc = accounts.find(a => a.userId === toUser.id && a.type === "checking");
  balances[fromAcc] -= amount;
  balances[toAcc.id] += amount;
  res.json({ ok: true });
});

app.get("/accounts/:handle", (req, res) => {
  const user = users.find(u => u.handle === req.params.handle);
  if (!user) return res.status(404).json({ error: "User not found" });
  const accs = accounts.filter(a => a.userId === user.id);
  res.json(accs.map(a => ({ ...a, balance: balances[a.id] })));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
