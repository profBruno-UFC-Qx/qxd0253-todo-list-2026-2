import type { Result, StrapiCollectionResponse, StrapiSingleResponse } from "./types";

// O endereço da API muda entre ambientes (desenvolvimento, produção...),
// então ele fica fora do código, no arquivo .env (veja .env.example).
// O Vite só expõe ao navegador variáveis que começam com VITE_.
const BASE_URL = import.meta.env.VITE_API_URL;

export async function request<T>(
  url: string, options? : RequestInit
): Promise<Result<T>> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, options);
    // 204 (No Content) não tem corpo; e um erro do servidor pode vir em HTML,
    // não em JSON. Nesses casos, body fica null em vez de lançar uma exceção.
    const body = response.status === 204 ? null : await response.json().catch(() => null)
    if (!response.ok) {
      return {
        success: false,
        error: {
          name: body?.error?.name ?? 'HTTP_ERROR',
          status: response.status,
          message: body?.error?.message ?? response.statusText
        }
      }
    }
    
    
    return {
      success: true,
      data: body
    };

  } catch (error) {
    // Chegar aqui significa que não houve resposta HTTP nenhuma (servidor
    // fora do ar, sem internet, CORS...). Por isso não existe um status real:
    // usamos 0, o mesmo valor que o navegador usa nessa situação.
    return {
      success: false,
      error: {
        status: 0,
        name: 'NETWORK_ERROR',
        message: (error as Error).message
      }
    };
  }
}


// Toda chamada autenticada passa por aqui: muda apenas o método,
// a URL e (opcionalmente) os dados enviados.
async function send<TOutput>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown,
): Promise<Result<TOutput>> {
  const headers: Record<string, string> = {};
  // Sem token salvo, getItem devolve null e enviaríamos "Bearer null".
  // Nesse caso, a requisição vai sem o cabeçalho, como um visitante.
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  let body: string | undefined;
  if (data !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ data }); // o Strapi espera { data: {...} }
  }
  const result = await request<TOutput>(url, { method, headers, body });

  // 401 = o servidor não reconheceu quem fez a requisição: sem token,
  // token expirado ou inválido. O token salvo não serve mais, então
  // apagamos e mandamos o usuário fazer login de novo.
  // (Fica aqui e não em request() porque o login também usa request(),
  // e lá um erro deve ser mostrado ao usuário, não redirecionado.)
  if (!result.success && result.error.status === 401) {
    localStorage.removeItem("token");
    window.location.replace("/login.html");
  }

  return result;
}

// TInput  = formato que ENVIAMOS (ex.: categoria como documentId)
// TOutput = formato que RECEBEMOS (ex.: categoria como objeto completo)

export async function getAll<TOutput>(
  url: string,
): Promise<Result<StrapiCollectionResponse<TOutput>>> {
  return send<StrapiCollectionResponse<TOutput>>("GET", url);
}

export async function create<TInput, TOutput>(
  url: string,
  data: TInput,
): Promise<Result<StrapiSingleResponse<TOutput>>> {
  return send<StrapiSingleResponse<TOutput>>("POST", url, data);
}

export async function update<TInput, TOutput>(
  url: string,
  data: TInput,
): Promise<Result<StrapiSingleResponse<TOutput>>> {
  return send<StrapiSingleResponse<TOutput>>("PUT", url, data);
}

export async function remove(url: string): Promise<Result<null>> {
  return send<null>("DELETE", url);
}
