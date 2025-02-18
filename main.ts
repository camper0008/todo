import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import vento from "jsr:@vento/vento";
import { load, save, timeFromDate, Todo } from "./mod.ts";
import { send } from "jsr:@oak/oak/send";

type AddBody = {
  title: Todo["title"];
  description: Todo["description"];
  secret: string;
};

type RemoveBody = {
  id: Todo["id"];
  secret: string;
};

async function listen({ port, secret }: Config) {
  const todos = await load();
  await save(todos);

  const env = vento();
  const routes = new Router();

  routes.get("/", async (ctx) => {
    const result = await env.run("tmpl/index.vto", { todos });
    ctx.response.body = result.content;
  });

  routes.get("/public/:_+", async (ctx) => {
    const filePath = ctx.request.url.pathname.replace("/public", "");
    await send(ctx, filePath, {
      root: "./public",
    });
  });

  routes.get("/todos", (ctx) => {
    ctx.response.body = { type: "ok", todos };
  });
  routes.post("/add", async (ctx) => {
    const body: AddBody = await ctx.request.body.json();
    if (body.secret !== secret) {
      ctx.response.body = { type: "error", msg: "bad secret" };
      return;
    }
    const { title, description } = body;
    const time = timeFromDate(new Date());
    const id = crypto.randomUUID();
    todos.push({ title, description, time, id });
    await save(todos);
    ctx.response.body = { type: "ok" };
  });
  routes.post("/remove", async (ctx) => {
    const body: RemoveBody = await ctx.request.body.json();
    if (body.secret !== secret) {
      ctx.response.body = { type: "error", msg: "bad secret" };
      return;
    }
    const index = todos.findIndex((v) => v.id === body.id);
    if (index === -1) {
      ctx.response.body = { type: "error", msg: "bad id" };
      return;
    }
    todos.splice(index, 1);
    await save(todos);
    ctx.response.body = { type: "ok" };
  });

  const app = new Application();
  app.use(routes.routes());
  app.use(routes.allowedMethods());
  app.addEventListener(
    "listen",
    ({ port }) => console.log("listening on", port),
  );

  await app.listen({ port });
}

type Config = {
  secret: string;
  port: number;
};

async function configFromFile(path: string): Promise<Config | null> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
    return null;
  }
}

async function main() {
  const configPath = "conf.json";
  const config = await configFromFile(configPath);
  if (!config) {
    console.error(`error: could not find config at '${configPath}'`);
    Deno.exit(1);
  }
  await listen(config);
}

if (import.meta.main) {
  await main();
}
