import * as api from "../api";
import type {
  Result,
  StrapiCollectionResponse,
  StrapiSingleResponse,
  Task,
  TaskInput,
} from "../types";

// Converte o que recebemos (Task) no que enviamos (TaskInput).
function toInput(task: Task): TaskInput {
  return {
    description: task.description,
    done: task.done,
    deadline: task.deadline,
    category: task.category.documentId,
  };
}

export async function getAll(): Promise<Result<StrapiCollectionResponse<Task>>> {
  return api.getAll<Task>("/tasks?populate=category");
}

export async function create(input: TaskInput): Promise<Result<StrapiSingleResponse<Task>>> {
  return api.create<TaskInput, Task>("/tasks?populate=category", input);
}

export async function update(task: Task): Promise<Result<StrapiSingleResponse<Task>>> {
  return api.update<TaskInput, Task>(`/tasks/${task.documentId}?populate=category`, toInput(task));
}

export async function remove(id: string): Promise<Result<null>> {
  return api.remove(`/tasks/${id}`);
}
