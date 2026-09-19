// Offline regression tests: no application server or database is contacted.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHmac } = require("node:crypto");
const { test } = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Buffer, process: { env: { AUTH_SECRET: "offline-test-secret" } },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  }, { filename: file });
  return exports;
}

function loadDb(prisma) {
  return loadModule("src/lib/local-db.ts", {
    "server-only": {},
    "@prisma/client": {},
    "@/lib/auth-crypto": { hashPassword: () => "offline-hash" },
    "@/lib/prisma": { prisma },
  });
}

function fixture() {
  const calls = { users: 0, settings: 0, orders: 0 };
  const prisma = {
    user: { count: async () => { calls.users++; return 1; } },
    systemSetting: { count: async () => { calls.settings++; return 1; } },
    provider: { findMany: async () => [], count: async () => 7 },
    order: { findMany: async () => { calls.orders++; return []; } },
  };
  return { calls, prisma, db: loadDb(prisma) };
}

test("concurrent and subsequent reads initialize once, but fetch fresh business data", async () => {
  const { db, calls } = fixture();
  await Promise.all([db.getOrders(), db.getProviders(), db.getOrders("user-l")]);
  await db.getOrders();
  assert.deepEqual(calls, { users: 1, settings: 1, orders: 3 });
});

test("failed initialization can recover on the next request", async () => {
  const { db, prisma, calls } = fixture();
  prisma.user.count = async () => {
    calls.users++;
    if (calls.users === 1) throw new Error("temporary database outage");
    return 1;
  };
  await assert.rejects(db.getOrders(), /temporary database outage/);
  await db.getOrders();
  assert.equal(calls.users, 2);
  assert.equal(calls.orders, 1);
});

test("area users are filtered in the database; admin requests keep all orders", async () => {
  const { db, prisma } = fixture();
  const filters = [];
  prisma.order.findMany = async (query) => { filters.push(query.where); return []; };
  await db.getOrders("user-l");
  await db.getOrders();
  assert.equal(filters[0].userId, "user-l");
  assert.equal(filters[1], undefined);
});

test("individual lookups and provider counts do not load entire tables", async () => {
  const { db, prisma } = fixture();
  const user = { id: "user-l", name: "Logistica", email: "l@test", role: "L", passwordHash: "hash" };
  prisma.user.findUnique = async ({ where }) => where.id === user.id ? user : null;
  prisma.provider.findUnique = async ({ where }) => where.id === "provider-1" ? { id: where.id, businessName: "Proveedor" } : null;
  prisma.order.findUnique = async ({ where }) => { assert.equal(where.id, "missing"); return null; };
  prisma.provider.findMany = prisma.order.findMany = async () => { throw new Error("Full table read"); };
  assert.equal((await db.getUserRecordById("user-l")).name, user.name);
  assert.equal(await db.getUserRecordById("missing"), null);
  assert.equal((await db.getProviderById("provider-1")).businessName, "Proveedor");
  assert.equal(await db.getProviderById("missing"), null);
  assert.equal(await db.getOrderById("missing"), null);
  assert.equal(await db.getProviderCount(), 7);
});

test("session lookup preserves cookie compatibility and returns fresh roles", async () => {
  let cookie;
  let reads = 0;
  let role = "L";
  const auth = loadModule("src/lib/auth.ts", {
    "server-only": {},
    "node:crypto": require("node:crypto"),
    "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) },
    // Outside Server Components, React cache executes normally (no cross-request cache).
    react: require("react"),
    "@/lib/auth-crypto": {},
    "@/lib/local-db": {
      getUserRecordById: async (id) => { reads++; return { id, name: "User", role, email: "u@test", passwordHash: "private" }; },
      getUserRecords: async () => { throw new Error("Full user table read"); },
    },
  });
  assert.equal(await auth.getCurrentUser(), null);
  cookie = "user-l.invalid";
  assert.equal(await auth.getCurrentUser(), null);
  assert.equal(reads, 0);
  cookie = `user-l.${createHmac("sha256", "offline-test-secret").update("user-l").digest("hex")}`;
  const user = await auth.getCurrentUser();
  assert.equal(user.id, "user-l");
  assert.equal(user.role, "L");
  assert.equal(user.passwordHash, undefined);
  role = "F";
  assert.equal((await auth.getCurrentUser()).role, "F");
  assert.equal(reads, 2);
});

test("orders page passes only the permitted query result to the unchanged view", async () => {
  let currentUser = { id: "user-l", role: "L" };
  const scopes = [];
  const orders = [{ id: "order-1" }];
  const page = loadModule("src/app/ordenes/page.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/components/dashboard/orders-manager": { OrdersManager: "OrdersManager" },
    "@/components/protected-panel": { ProtectedPanel: "ProtectedPanel" },
    "@/lib/auth": { getCurrentUser: async () => currentUser },
    "@/lib/local-db": {
      getOrders: async (scope) => { scopes.push(scope); return orders; },
      getProviders: async () => [], getSettings: async () => ({}),
    },
  });
  const view = await page.default();
  assert.equal(view.props.children.props.children.props.initialOrders, orders);
  assert.equal(scopes[0], "user-l");
  currentUser = { id: "admin", role: "ADMIN" };
  await page.default();
  assert.equal(scopes[1], undefined);
  currentUser = null;
  assert.equal(await page.default(), null);
  assert.equal(scopes.length, 2);
});

test("PDF page checks ownership before looking up a single provider", async () => {
  let currentUser = { id: "other-user", role: "L" };
  let providerReads = 0;
  const page = loadModule("src/app/ordenes/[id]/pdf/page.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "next/image": { default: "Image" }, "next/link": { default: "Link" },
    "next/navigation": { notFound() { throw new Error("not-found"); }, redirect() { throw new Error("redirect"); } },
    "@/components/dashboard/print-pdf-button": { PrintPdfButton: "PrintPdfButton" },
    "@/lib/auth": { getCurrentUser: async () => currentUser },
    "@/lib/order-calculations": {},
    "@/lib/local-db": {
      getOrderById: async (id) => { assert.equal(id, "order-1"); return { id, userId: "owner", providerId: "provider-1" }; },
      getProviderById: async (id) => { providerReads++; assert.equal(id, "provider-1"); return null; },
      getSettings: async () => ({}),
    },
  });
  const params = Promise.resolve({ id: "order-1" });
  await assert.rejects(page.default({ params }), /not-found/);
  assert.equal(providerReads, 0);
  currentUser = { id: "owner", role: "L" };
  await assert.rejects(page.default({ params }), /not-found/);
  assert.equal(providerReads, 1);
});
