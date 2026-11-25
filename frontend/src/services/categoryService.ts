import * as api from "../api";
import type {
  StrapiCollectionResponse,
  Category,
  Result,
} from "../types";

export async function getAll(): Promise<Result<StrapiCollectionResponse<Category>>> {
  return api.getAll<Category>("/categories")
}
