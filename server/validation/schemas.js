const { z } = require("zod");

const emptyToUndefined = (value) => value === "" || value === null ? undefined : value;
const optionalNumber = (schema) => z.preprocess(emptyToUndefined, schema.optional());
const id = z.coerce.number().int().positive("A valid ID is required");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Use a valid time");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters").max(100),
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(6, "Password must contain at least 6 characters").max(72),
}).strict();

const loginSchema = z.object({
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required").max(72),
}).strict();

const carSchema = z.object({
  name: z.string().trim().min(2, "Car name must contain at least 2 characters").max(100),
  type: z.string().trim().min(2, "Vehicle type must contain at least 2 characters").max(60),
  pricePerKm: z.coerce.number().positive("Price per km must be greater than zero").max(100000),
}).strict();

const updateCarSchema = carSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "Provide at least one field to update",
});

const bookingSchema = z.object({
  carId: id,
  pickupAddress: z.string().trim().min(3, "Select a pickup location").max(255),
  pickupLat: optionalNumber(z.coerce.number().min(-90).max(90)),
  pickupLng: optionalNumber(z.coerce.number().min(-180).max(180)),
  dropAddress: z.string().trim().min(3, "Select a destination").max(255),
  dropLat: optionalNumber(z.coerce.number().min(-90).max(90)),
  dropLng: optionalNumber(z.coerce.number().min(-180).max(180)),
  distanceKm: z.coerce.number().positive("Distance must be greater than zero").max(50000),
  travelDate: date,
  travelTime: time,
}).strict();

const bookingStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "completed", "cancelled"]),
}).strict();

const bookingQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  status: z.union([z.enum(["pending", "accepted", "completed", "cancelled"]), z.literal("")]).optional().default(""),
  paymentStatus: z.union([z.enum(["unpaid", "paid", "refunded"]), z.literal("")]).optional().default(""),
  carId: z.preprocess(emptyToUndefined, id.optional()),
  dateFrom: z.union([date, z.literal("")]).optional().default(""),
  dateTo: z.union([date, z.literal("")]).optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(["createdAt", "travelDate", "totalPrice", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).optional().default("DESC"),
}).refine((data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo, {
  message: "Start date must be before end date",
  path: ["dateFrom"],
});

const carQuerySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  type: z.string().trim().max(60).optional().default(""),
  sortBy: z.enum(["name", "type", "pricePerKm", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["ASC", "DESC", "asc", "desc"]).optional().default("ASC"),
});

const paymentIntentSchema = z.object({ bookingId: id }).strict();
const markPaidSchema = z.object({
  bookingId: id,
  paymentIntentId: z.string().trim().min(1, "Payment intent is required").max(255),
}).strict();

module.exports = {
  registerSchema, loginSchema, carSchema, updateCarSchema, bookingSchema,
  bookingStatusSchema, bookingQuerySchema, carQuerySchema,
  paymentIntentSchema, markPaidSchema,
};
