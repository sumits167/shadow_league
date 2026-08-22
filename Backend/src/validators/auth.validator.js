import { z } from 'zod';

export const usernameValidation=z
    .string()
    .min(2,"Username must be atleast 2 character")
    .max(10,"Username must be no more than 20 character")
    .regex(/^[a-zA-Z0-9_]+$/,"Username must not cantain specail character")



export const signupSchema = z.object({

    email: z.string().email(),
    password: z.string().min(6).max(20),
    username: usernameValidation
})

export const loginSchema = z.object({
    identifier: z.string(),
    password: z.string().min(6).max(20),
})

export const checkUserNameUniqueSchema = z.object({
    username: usernameValidation,
})

export const checkEmailUniqueSchema = z.object({
    email: z.string().email(),
})


export const verifyCodeSchema=z.object({
    username: z.string().min(2).max(20),
    code:z.string().min(6).max(6)
})


export const oauthSchema=z.object({
    provider: z.string().min(1).max(20),
    provideruserId: z.string().min(1).max(50),
    email: z.string().min(1).max(20),
    name: z.string().min(1).max(20),
})



// export const refreshTokenSchema = z.object({
//     refreshToken: z.string().min(1)
// })