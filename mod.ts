export type Time = {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
};

export function timeFromDate(date: Date): Time {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export type Todo = {
  id: string;
  title: string;
  description: string;
  time: Time;
};

export async function save(todos: Todo[]): Promise<void> {
  await Deno.writeTextFile("todo.json", JSON.stringify(todos));
}

export async function load(): Promise<Todo[]> {
  try {
    return JSON.parse(await Deno.readTextFile("todo.json"));
  } catch {
    return [];
  }
}
