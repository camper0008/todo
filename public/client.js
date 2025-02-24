async function editApiRequest(form, secretStore) {
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
}

async function addApiRequest(form, secretStore) {
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
}

function bindEditDialog(secretStore) {
  const dialog = document.querySelector("#edit-dialog");
  const form = document.querySelector("#edit-form");

  const opens = document.querySelectorAll(".edit");
  for (const open of opens) {
    open.addEventListener("click", (event) => {
      event.preventDefault();
      form.elements.id.value = open.dataset.todo;
      form.elements.title.value = open.dataset.todoTitle;
      form.elements.description.value = open.dataset.todoDescription;
      dialog.showModal();
    });
  }

  const close = document.querySelector("#edit-close");
  close.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.close();
  });

  dialog.addEventListener("submit", (event) => {
    event.preventDefault();
    editApiRequest(form, secretStore);
  });

  const submit = document.querySelector("#edit-submit");
  submit.addEventListener("click", (event) => {
    event.preventDefault();
    editApiRequest(form, secretStore);
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
  const form = document.querySelector("#add-form");

  const open = document.querySelector("#add-open");
  open.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.showModal();
  });

  const close = document.querySelector("#add-close");
  close.addEventListener("click", (event) => {
    event.preventDefault();
    dialog.close();
  });

  dialog.addEventListener("submit", (event) => {
    event.preventDefault();
    addApiRequest(form, secretStore);
  });

  const submit = document.querySelector("#add-submit");
  submit.addEventListener("click", (event) => {
    event.preventDefault();
    addApiRequest(form, secretStore);
  });
}

function promptSecret(secretStore) {
  if (!secretStore.secret) secretStore.secret = prompt("enter secret");
  if (secretStore.secret) {
    localStorage.setItem("secret", secretStore.secret);
  }
  return secretStore.secret;
}

function bindRemoveButtons(secretStore) {
  const removes = document.querySelectorAll(".remove");
  for (const remove of removes) {
    remove.addEventListener("click", async (event) => {
      event.preventDefault();
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
