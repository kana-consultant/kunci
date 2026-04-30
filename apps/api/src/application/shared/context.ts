export interface AppContext {
  headers: Headers
}

export interface AuthedContext extends AppContext {
  userId: string
  role: "admin" | "user"
}
