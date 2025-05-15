import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['member', 'employee', 'admin']);
export const dockingDirectionEnum = pgEnum('docking_direction', ['bow_in', 'stern_in', 'side_to']);
export const tieUpSideEnum = pgEnum('tie_up_side', ['port', 'starboard', 'both']);
export const pumpPortLocationEnum = pgEnum('pump_port_location', ['stern', 'port_side', 'starboard_side', 'cabin_roof']);
export const requestStatusEnum = pgEnum('request_status', ['Requested', 'Scheduled', 'Completed', 'Canceled', 'Waitlisted']);
export const paymentStatusEnum = pgEnum('payment_status', ['Pending', 'Paid', 'Failed', 'Refunded']);
export const serviceTypeEnum = pgEnum('service_type', ['one-time', 'monthly', 'seasonal']);
export const serviceLevelEnum = pgEnum('service_level', ['single-head', 'multi-head']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('member'),
  oauthProvider: text('oauth_provider'),
  oauthId: text('oauth_id'),
  serviceLevelId: integer('service_level_id').references(() => serviceLevel.id),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Boat Owner Schema (extends users)
export const boatOwner = pgTable('boat_owner', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Boats
export const boat = pgTable('boat', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id').notNull().references(() => boatOwner.id),
  name: text('name').notNull(),
  year: integer('year'),
  make: text('make'),
  model: text('model'),
  color: text('color'),
  photoUrl: text('photo_url'),
  dockingDirection: dockingDirectionEnum('docking_direction'),
  tieUpSide: tieUpSideEnum('tie_up_side'),
  pumpPortLocations: json('pump_port_locations').$type<string[]>(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Marinas
export const marina = pgTable('marina', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Slip Assignments
export const slipAssignment = pgTable('slip_assignment', {
  id: serial('id').primaryKey(),
  boatId: integer('boat_id').notNull().references(() => boat.id),
  marinaId: integer('marina_id').notNull().references(() => marina.id),
  dock: integer('dock').notNull(),
  slip: integer('slip').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Service Levels
export const serviceLevel = pgTable('service_level', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // Stored in cents
  description: text('description'),
  headCount: integer('head_count').default(1),
  type: serviceTypeEnum('type').notNull(),
  seasonStart: date('season_start'),
  seasonEnd: date('season_end'),
  monthlyQuota: integer('monthly_quota'),
  onDemandQuota: integer('on_demand_quota'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Pump Out Requests
export const pumpOutRequest = pgTable('pump_out_request', {
  id: serial('id').primaryKey(),
  boatId: integer('boat_id').notNull().references(() => boat.id),
  weekStartDate: date('week_start_date').notNull(),
  status: requestStatusEnum('status').notNull().default('Requested'),
  ownerNotes: text('owner_notes'),
  adminNotes: text('admin_notes'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('Pending'),
  paymentId: text('payment_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Pump Out Logs
export const pumpOutLog = pgTable('pump_out_log', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id').notNull().references(() => pumpOutRequest.id),
  changeTimestamp: timestamp('change_timestamp').defaultNow(),
  prevStatus: requestStatusEnum('prev_status'),
  newStatus: requestStatusEnum('new_status').notNull(),
  beforeUrl: text('before_url'),
  duringUrl: text('during_url'),
  afterUrl: text('after_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employee Assignments
export const employeeAssignment = pgTable('employee_assignment', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => users.id),
  requestId: integer('request_id').notNull().references(() => pumpOutRequest.id),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, passwordHash: true, createdAt: true })
  .extend({
    password: z.string().min(8),
  });

export const insertBoatOwnerSchema = createInsertSchema(boatOwner)
  .omit({ id: true, createdAt: true });

export const insertBoatSchema = createInsertSchema(boat)
  .omit({ id: true, createdAt: true });

export const insertMarinaSchema = createInsertSchema(marina)
  .omit({ id: true, createdAt: true });

export const insertSlipAssignmentSchema = createInsertSchema(slipAssignment)
  .omit({ id: true, createdAt: true });

export const insertServiceLevelSchema = createInsertSchema(serviceLevel)
  .omit({ id: true, createdAt: true });

export const insertPumpOutRequestSchema = createInsertSchema(pumpOutRequest)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertPumpOutLogSchema = createInsertSchema(pumpOutLog)
  .omit({ id: true, createdAt: true });

export const insertEmployeeAssignmentSchema = createInsertSchema(employeeAssignment)
  .omit({ id: true, assignedAt: true });

// Types for insert and select
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBoatOwner = z.infer<typeof insertBoatOwnerSchema>;
export type BoatOwner = typeof boatOwner.$inferSelect;

export type InsertBoat = z.infer<typeof insertBoatSchema>;
export type Boat = typeof boat.$inferSelect;

export type InsertMarina = z.infer<typeof insertMarinaSchema>;
export type Marina = typeof marina.$inferSelect;

export type InsertSlipAssignment = z.infer<typeof insertSlipAssignmentSchema>;
export type SlipAssignment = typeof slipAssignment.$inferSelect;

export type InsertServiceLevel = z.infer<typeof insertServiceLevelSchema>;
export type ServiceLevel = typeof serviceLevel.$inferSelect;

export type InsertPumpOutRequest = z.infer<typeof insertPumpOutRequestSchema>;
export type PumpOutRequest = typeof pumpOutRequest.$inferSelect;

export type InsertPumpOutLog = z.infer<typeof insertPumpOutLogSchema>;
export type PumpOutLog = typeof pumpOutLog.$inferSelect;

export type InsertEmployeeAssignment = z.infer<typeof insertEmployeeAssignmentSchema>;
export type EmployeeAssignment = typeof employeeAssignment.$inferSelect;
