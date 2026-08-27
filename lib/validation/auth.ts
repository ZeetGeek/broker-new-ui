import { z } from "zod";

export const emailSchema = z
    .string()
    .trim()
    .min(1, "Enter your email")
    .pipe(z.email("Enter a valid email"));

export const loginPasswordSchema = z.string().min(1, "Enter your password");

const hasLetter = /[A-Za-z]/;
const hasNumber = /\d/;

export const registerPasswordSchema = z
    .string()
    .min(1, "Enter a password")
    .min(8, "Use at least 8 characters")
    .regex(hasLetter, "Include at least one letter")
    .regex(hasNumber, "Include at least one number");

export const loginSchema = z.object({
    email: emailSchema,
    password: loginPasswordSchema,
    rememberMe: z.boolean(),
});

export const registerSchema = z
    .object({
        portal: z.enum(["owner", "broker"]),
        email: emailSchema,
        password: registerPasswordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z
    .object({
        password: registerPasswordSchema,
        confirmPassword: z.string().min(1, "Confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export type PasswordRequirementId = "length" | "letter" | "number";

export const PASSWORD_REQUIREMENTS: {
    id: PasswordRequirementId;
    label: string;
    test: (password: string) => boolean;
}[] = [
    {
        id: "length",
        label: "At least 8 characters",
        test: (password) => password.length >= 8,
    },
    {
        id: "letter",
        label: "At least one letter",
        test: (password) => hasLetter.test(password),
    },
    {
        id: "number",
        label: "At least one number",
        test: (password) => hasNumber.test(password),
    },
];
