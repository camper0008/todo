function bindEditDialog(secretStore) {
  const dialog = document.querySelector("#edit-dialog");
  const form = document.querySelector("#edit-form");

  const opens = document.querySelectorAll(".edit");
  for (const open of opens) {
    open.addEventListener("click", () => {
      event.preventDefault();
      form.elements.id.value = open.dataset.todo;
      dialog.showModal();
    });
  }

  const close = document.querySelector("#edit-close");
  close.addEventListener("click", () => {
    event.preventDefault();
    dialog.close();
  });

  const submit = document.querySelector("#edit-submit");
  submit.addEventListener("click", async () => {
    event.preventDefault();
    const id = form.elements.id.value;
    const title = form.elements.title.value;
    const description = form.elements.description.value;
    const secret = promptSecret(secretStore);
    if (!secret) return;

    const body = JSON.stringify({ id, title, description, secret });
    const response = await (await fetch("/edit", {
      body,
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    })).json();

    handleResponse(response, secretStore);
  });
}

function handleResponse(response, secretStore) {
  if (response.type !== "ok") {
    if (response.error === "bad_secret") {
      localStorage.removeItem("secret");
      secretStore.secret = null;
    }
    alert(response.error);
    return;
  }
  location.reload();
}

function bindAddDialog(secretStore) {
  const dialog = document.querySelector("#add-dialog");

  const open = document.querySelector("#add-open");
  open.addEventListener("click", () => {
    event.preventDefault();
    dialog.showModal();
  });

  const close = document.querySelector("#add-close");
  close.addEventListener("click", () => {
    event.preventDefault();
    dialog.close();
  });

  const submit = document.querySelector("#add-submit");
  submit.addEventListener("click", async () => {
    event.preventDefault();
    const form = document.querySelector("#add-form");
    const title = form.elements.title.value;
    const description = form.elements.description.value;
    const secret = promptSecret(secretStore);
    if (!secret) return;

    const body = JSON.stringify({ title, description, secret });
    const response = await (await fetch("/add", {
      body,
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    })).json();

    handleResponse(response, secretStore);
  });
}

function promptSecret(secretStore) {
  if (!secretStore.secret) secretStore.secret = prompt("enter secret");
  localStorage.setItem("secret");
  return secretStore.secret;
}

function bindRemoveButtons(secretStore) {
  const removes = document.querySelectorAll(".remove");
  for (const remove of removes) {
    remove.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const secret = promptSecret(secretStore);
      if (!secret) return;
      const id = remove.dataset.todo;
      const body = JSON.stringify({ id, secret });
      const response = await (await fetch("/remove", {
        body,
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      })).json();

      handleResponse(response, secretStore);
    });
  }
}

function main() {
  const secretStore = {
    secret: localStorage.getItem("secret"),
  };

  bindAddDialog(secretStore);
  bindEditDialog(secretStore);
  bindRemoveButtons(secretStore);
}

main();
