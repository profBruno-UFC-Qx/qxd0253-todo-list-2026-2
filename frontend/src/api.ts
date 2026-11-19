import type { StrapiCollectionResponse, StrapiSingleResponse, Task } from "./types";

const BASE_URL = "http://localhost:1337/api";

export async function fetchCollection<T>(
  url: string,
): Promise<StrapiCollectionResponse<T> | null> {
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error((error as Error).message);
    return null;
  }
}

export async function updateTask(
  task: Omit<Task, "category">
): Promise<StrapiSingleResponse<Task> | null> {
  try {
    const response = await fetch(`${BASE_URL}/tasks/${task.documentId}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          description: task.description,
          done: task.done,
          deadline: task.deadline || null,
        },
      }),
    });
    if (!response.ok) {
      if (response.status === 400) {
        window.alert((await response.json()).error.message);
      }
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error((error as Error).message);
    return null;
  }
}

export async function createTask(
  task: Omit<Task, "id" | "documentId" | "category">,
  categoryId: string,
): Promise<StrapiSingleResponse<Task> | null> {
  try {
    const response = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          description: task.description,
          done: task.done,
          deadline: task.deadline || null,
          category: categoryId
        },
      }),
    });
    if (!response.ok) {
      if (response.status === 400) {
        window.alert((await response.json()).error.message);
      }
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error((error as Error).message);
    return null;
  }
}

export async function deleteTask(id: string,
): Promise<Boolean> {
  try {
    const response = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: "DELETE", 
    });
    if (!response.ok) {
      if (response.status === 400) {
        window.alert((await response.json()).error.message);
      }
      throw new Error(`Response status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error((error as Error).message);
    return false;
  }
}
