import { z } from 'zod';

/**
 * Password policy:
 *   - min 8: basic strength
 *   - max 72: bcrypt silently truncates beyond 72 bytes; enforcing here
 *     makes the behavior explicit instead of surprising.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

/**
 * Bangladeshi phone numbers: 11 digits, starting with 01.
 * Optional because a user may sign up without providing a phone.
 */
const phoneSchema = z
  .string()
  .regex(/^01[3-9]\d{8}$/, 'Must be a valid BD phone number (e.g. 01710000001)')
  .optional();

export const signupPassengerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: phoneSchema,
  password: passwordSchema,
});

export const signupDriverSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  phone: phoneSchema,
  password: passwordSchema,
  vehicle: z.object({
    name: z.string().trim().min(1).max(40),
    // Tesla capacity: PRD demo uses 3 (Bullet), upper bound keeps it realistic.
    capacity: z.number().int().min(1).max(6),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupPassengerInput = z.infer<typeof signupPassengerSchema>;
export type SignupDriverInput = z.infer<typeof signupDriverSchema>;
export type LoginInput = z.infer<typeof loginSchema>;