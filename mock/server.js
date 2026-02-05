const path = require("path");
const fs = require("fs");
const jsonServer = require("json-server");

const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const dbFile = path.join(__dirname, "db.json");

const initialData = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
const router = jsonServer.router(dbFile);

// Prevent writes to disk to keep data ephemeral.
router.db.write = () => Promise.resolve();

const resetDb = () => {
  const clone = JSON.parse(JSON.stringify(initialData));
  router.db.setState(clone);
};

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post("/__reset", (_req, res) => {
  resetDb();
  res.status(200).json({ ok: true });
});

server.use((req, _res, next) => {
  if (req.method === "POST" && req.path === "/__reset") {
    return next();
  }
  return next();
});

server.use(router);

resetDb();

const port = 4000;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`JSON Server running on http://localhost:${port}`);
});
