// src/lib/auth.ts
import { betterAuth } from "better-auth"

export const createAuth = (env: any) => {
  return betterAuth({
    database: {
      provider: "sqlite",
      db: env.DB, // Pass D1 database binding
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Set to true in production
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        enabled: !!env.GOOGLE_CLIENT_ID,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID || "",
        clientSecret: env.GITHUB_CLIENT_SECRET || "",
        enabled: !!env.GITHUB_CLIENT_ID,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
    },
    user: {
      additionalFields: {
        businessName: {
          type: "string",
          required: false,
        },
        businessAddress: {
          type: "string",
          required: false,
        },
        taxId: {
          type: "string",
          required: false,
        },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
export type Session = Auth["$Infer"]["Session"]["session"]
export type User = Auth["$Infer"]["Session"]["user"]
