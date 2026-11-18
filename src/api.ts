import type { StrapiCollectionResponse } from "./types"

const BASE_URL = "http://localhost:1337/api"

export async function getAll<T>(url: string): Promise<StrapiCollectionResponse<T> | null> {
  try {
    const response = await fetch(`${BASE_URL}${url}`)
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error((error as Error).message);
    return null
  }
}