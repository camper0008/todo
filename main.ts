import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { load, save, Time, timeFromDate, Todo } from "./mod.ts";

function pad(value: number, length: number = 2): string {
  return value.toString().padStart(length, "0");
}

function formatDate({ year, month, date, hour, minute }: Time): string {
  return `${pad(date)}/${pad(month)}-${year} ${pad(hour)}:${pad(minute)}`;
}

type AddBody = {
  title: Todo["title"];
  description: Todo["description"];
  secret: string;
};

type RemoveBody = {
  id: Todo["id"];
  secret: string;
};

function formatTodo(todo: Todo) {
  return `<p class="title"><b>- ${todo.title}</b> <a class="remove" data-todo="${todo.id}" href="#remove-${todo.id}">[x]</a> <time>(${
    formatDate(todo.time)
  })</time></p><p class="content">    ${
    todo.description.replaceAll("\n", "\n  ")
  }</p>`;
}

async function listen(port: number) {
  const secret = prompt("enter secret:");

  const todos = await load();
  await save(todos);

  const routes = new Router();

  routes.get("/", async (ctx) => {
    const template = await Deno.readTextFile("index.tmpl.html").then((v) =>
      v
        .replaceAll(
          "{{}}",
          todos.map(formatTodo).join("\n"),
        )
    );
    ctx.response.body = template;
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

async function main() {
  try {
    const port = parseInt(Deno.args[0]);
    if (isNaN(port)) {
      console.error(`invalid port '${Deno.args[0]}'`);
      return;
    }
    await listen(
      port,
    );
  } catch {
    console.error(`invalid port '${Deno.args[0]}'`);
  }
}

if (import.meta.main) {
  await main();
}
