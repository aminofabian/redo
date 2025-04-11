type UserRole = "USER" | "ADMIN"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string | undefined
    role: UserRole
  }
  
  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends User {}
} 