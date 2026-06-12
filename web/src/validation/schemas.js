import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(72),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must contain at least 8 characters").max(72),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100),
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must contain at least 6 characters").max(72),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").max(72),
  newPassword: z.string().min(8, "New password must contain at least 8 characters").max(72),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const carSchema = z.object({
  name: z.string().trim().min(2, "Car name must contain at least 2 characters").max(100),
  type: z.string().trim().min(2, "Vehicle type must contain at least 2 characters").max(60),
  pricePerKm: z.coerce.number().positive("Price per km must be greater than zero").max(100000),
  imageUrl: z.union([z.url("Enter a valid image URL"), z.literal("")]).optional(),
});

export const bookingSchema = z.object({
  carId: z.coerce.number().int().positive("Select a car"),
  pickupAddress: z.string().trim().min(3, "Select a pickup location"),
  dropAddress: z.string().trim().min(3, "Select a destination"),
  distanceKm: z.coerce.number().positive("Distance must be greater than zero"),
  travelDate: z.string().min(1, "Select a travel date"),
  travelTime: z.string().min(1, "Select a pickup time"),
});
