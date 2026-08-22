// lib/api.ts
// "use server"
// import { parseSetCookie } from 'set-cookie-parser';
// "use client"
// import { Endpoint } from "./apies/endpoints"


const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000";



let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
  // endpoint: string
  endpoint: string
  options: RequestInit
}> = []

async function refreshToken() {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh_Token`, {
    method: 'POST',
    credentials: 'include'  // sends refreshToken httpOnly cookie
  })

  if (!res.ok) throw new Error('RefreshFailed')
  return res.json()
}

async function request(endpoint: string, options: RequestInit = {}, retry = true) {

  let error;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });


    console.log("API Response : ", res);

    // success — return data
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json();
      }
      return { data: null };
    }

    try {
      error = await res.json();
    } catch {
      error = { message: `Server error (${res.status})` };
    }

    // accessToken expired
    if (error?.message === "Invalid token" && retry) {

      // if already refreshing — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, endpoint, options })
        })
      }

      isRefreshing = true

      try {
        // refresh the token
        await refreshToken()
        isRefreshing = false

        // retry all queued requests
        const queued = failedQueue
        failedQueue = []

        queued.forEach(({ resolve, reject, endpoint, options }) => {
          request(endpoint, options, false)
            .then(resolve)
            .catch(reject)
        })

        // retry original request (retry=false prevents infinite loop)
        return request(endpoint, options, false)

      } catch (error) {
        // refresh failed — force logout
        isRefreshing = false
        failedQueue = []

        window.dispatchEvent(new Event('auth:logout'))
        throw new Error('SessionExpired')
      }
    }

    // other errors
    //  error = await res.json();
    // console.error("API Error : ",error);
    throw new Error(error.message || 'Something went wrong');

  } catch (e: unknown) {

    //  throw new Error(error?.message ||(e instanceof Error ? e.message : 'Something went wrong'));
    throw new Error(error?.message || (e instanceof Error ? e.message : 'Something went wrong'));

    // return error
  }


}

export const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: unknown) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  put: (endpoint: string, body: unknown) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  patch: (endpoint: string, body: unknown) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' })
}