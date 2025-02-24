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

type EditBody = {
  id: Todo["id"];
  title: Todo["title"];
  description: Todo["description"];
  secret: string;
};

type RemoveBody = {
  id: Todo["id"];
  secret: string;
};

async function listen({ port, secret, hostname }: Config) {
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
      ctx.response.body = { type: "error", error: "bad_secret" };
      return;
    }
    const { title, description } = body;
    const time = timeFromDate(new Date());
    const id = crypto.randomUUID();
    todos.push({ title, description, time, id });
    await save(todos);
    ctx.response.body = { type: "ok" };
  });
  routes.post("/edit", async (ctx) => {
    const body: EditBody = await ctx.request.body.json();
    if (body.secret !== secret) {
      ctx.response.body = { type: "error", error: "bad_secret" };
      return;
    }
    const todo = todos.find((v) => v.id === body.id);
    if (todo === undefined) {
      ctx.response.body = { type: "error", error: "bad_id" };
      return;
    }
    todo.title = body.title;
    todo.description = body.description;
    await save(todos);
    ctx.response.body = { type: "ok" };
  });
  routes.post("/remove", async (ctx) => {
    const body: RemoveBody = await ctx.request.body.json();
    if (body.secret !== secret) {
      ctx.response.body = { type: "error", error: "bad_secret" };
      return;
    }
    const index = todos.findIndex((v) => v.id === body.id);
    if (index === -1) {
      ctx.response.body = { type: "error", error: "bad_id" };
      return;
    }
    todos.splice(index, 1);
    await save(todos);
    ctx.response.body = { type: "ok" };
  });

  const app = new Application();
  app.use(routes.routes());
  app.use(routes.allowedMethods());
  app.addEventListener("listen", ({ port, hostname }) => {
    console.log(`listening on ${hostname},`, port);
  });

  await app.listen({ port, hostname });
}

type Config = {
  port: number;
  hostname: string;
  secret: string;
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
