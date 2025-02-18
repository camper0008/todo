const addOpen = document.querySelector("#add-open");
const addClose = document.querySelector("#add-close");
const addSubmit = document.querySelector("#add-submit");
const addForm = document.querySelector("#add-form");
const addDialog = document.querySelector("#add-dialog");

addOpen.addEventListener("click", () => {
  event.preventDefault();
  addDialog.showModal();
});

addClose.addEventListener("click", () => {
  event.preventDefault();
  addDialog.close();
});

addSubmit.addEventListener("click", async () => {
  event.preventDefault();
  const title = addForm.elements.title.value;
  const description = addForm.elements.description.value;
  const secret = addForm.elements.secret.value;

  const body = JSON.stringify({ title, description, secret });
  const response = await (await fetch("/add", {
    body,
    method: "POST",
    headers: new Headers({ "Content-Type": "application/json" }),
  })).json();

  if (response.type !== "ok") {
    alert(JSON.stringify(response));
    return;
  }
  location.reload();
});

const removes = document.querySelectorAll(".remove");
let secret;
for (const remove of removes) {
  remove.addEventListener("click", async (ev) => {
    ev.preventDefault();
    if (!secret) secret = prompt("enter secret");
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
    if (response.type !== "ok") {
      alert(JSON.stringify(response));
      return;
    }
    location.reload();
  });
}
