import { Handler } from "$fresh/server.ts";
import { Hono } from "hono";
import auth from "./auth.ts";
import calendar from "./calendar.ts";
import shift from "./shift.ts";

const app = new Hono().basePath("/api");

app.route("/auth", auth);
app.route("/calendar", calendar);
app.route("/shift", shift);

app.get("/", (c) => c.json({ hello: "world" }));

export const handler: Handler = (req) => app.fetch(req);
export type AppType = typeof app;
