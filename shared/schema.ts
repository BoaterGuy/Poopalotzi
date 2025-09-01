import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json, date, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => {
    return {
      expireIdx: index("IDX_session_expire").on(table.expire),
    };
  }
);


// Enums
export const userRoleEnum = pgEnum('user_role', ['member', 'employee', 'admin']);
export const pieringDirectionEnum = pgEnum('piering_direction', ['bow_in', 'stern_in', 'side_to']);
export const tieUpSideEnum = pgEnum('tie_up_side', ['port', 'starboard', 'both']);
export const pumpPortLocationEnum = pgEnum('pump_port_location', ['port', 'starboard', 'bow', 'mid_ship', 'stern']);
export const requestStatusEnum = pgEnum('request_status', ['Requested', 'Scheduled', 'Completed', 'Canceled', 'Waitlisted']);
export const paymentStatusEnum = pgEnum('payment_status', ['Pending', 'Paid', 'Failed', 'Refunded']);
export const serviceTypeEnum = pgEnum('service_type', ['one-time', 'monthly', 'seasonal', 'bulk']);
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
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  activeMonth: text('active_month'), // Stored as "MM" format
  autoRenew: boolean('auto_renew').default(false),
  // Bulk plan specific fields
  bulkPlanYear: integer('bulk_plan_year'), // Year the bulk plan is valid for
  additionalPumpOuts: integer('additional_pump_outs').default(0), // Additional pump-outs purchased beyond base
  totalPumpOuts: integer('total_pump_outs').default(0), // Total pump-outs available (base + additional)
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
  length: integer('length'),
  color: text('color'),
  photoUrl: text('photo_url'),
  pieringDirection: pieringDirectionEnum('piering_direction'),
  dockingDirection: pieringDirectionEnum('docking_direction'),
  tieUpSide: tieUpSideEnum('tie_up_side'),
  pumpPortLocations: text('pump_port_locations').array(),
  pier: text('pier'),
  dock: text('dock'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Marinas
export const marina = pgTable('marina', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Dock Assignments
export const dockAssignment = pgTable('dock_assignment', {
  id: serial('id').primaryKey(),
  boatId: integer('boat_id').notNull().references(() => boat.id),
  marinaId: integer('marina_id').notNull().references(() => marina.id),
  pier: text('pier').notNull(), // Changed from dock to pier
  dock: text('dock').notNull(), // Changed from slip to dock
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
  // Bulk pricing fields
  basePrice: integer('base_price'), // For bulk type - stored in cents
  pricePerAdditional: integer('price_per_additional'), // For bulk type - stored in cents
  baseQuantity: integer('base_quantity'), // For bulk type - minimum number of pump outs included
  isActive: boolean('is_active').default(true),
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

// Clover Configuration
export const cloverConfig = pgTable('clover_config', {
  id: serial('id').primaryKey(),
  merchantId: text('merchant_id').notNull(),
  appId: text('app_id').notNull(),
  appSecret: text('app_secret').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),
  environment: text('environment').notNull().default('production'), // production-only
  isActive: boolean('is_active').default(true),
  webhookSecret: text('webhook_secret'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payment Transactions
export const paymentTransaction = pgTable('payment_transaction', {
  id: serial('id').primaryKey(),
  cloverPaymentId: text('clover_payment_id').notNull().unique(),
  orderId: text('order_id'),
  requestId: integer('request_id').references(() => pumpOutRequest.id),
  userId: integer('user_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(), // Amount in cents
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull(), // 'pending', 'completed', 'failed', 'refunded'
  paymentMethod: text('payment_method'), // Card type or payment method
  cardLast4: text('card_last4'),
  cardBrand: text('card_brand'),
  cloverResponse: json('clover_response'), // Store full Clover response for debugging
  errorMessage: text('error_message'),
  refundAmount: integer('refund_amount').default(0),
  refundedAt: timestamp('refunded_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  emailNotifications: boolean('email_notifications').default(true),
  welcomeEmails: boolean('welcome_emails').default(true),
  subscriptionEmails: boolean('subscription_emails').default(true),
  paymentEmails: boolean('payment_emails').default(true),
  renewalReminders: boolean('renewal_reminders').default(true),
  scheduleEmails: boolean('schedule_emails').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Email Notification Log
export const emailNotificationLog = pgTable('email_notification_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  emailType: text('email_type').notNull(), // 'welcome', 'subscription', 'payment', 'renewal', 'schedule'
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(), // 'sent', 'failed', 'simulated'
  sendgridMessageId: text('sendgrid_message_id'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').defaultNow(),
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

export const insertDockAssignmentSchema = createInsertSchema(dockAssignment)
  .omit({ id: true, createdAt: true });

export const insertServiceLevelSchema = createInsertSchema(serviceLevel)
  .omit({ id: true, createdAt: true });

export const insertPumpOutRequestSchema = createInsertSchema(pumpOutRequest)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    testMode: z.boolean().optional(),
  });

export const insertPumpOutLogSchema = createInsertSchema(pumpOutLog)
  .omit({ id: true, createdAt: true });

export const insertEmployeeAssignmentSchema = createInsertSchema(employeeAssignment)
  .omit({ id: true, assignedAt: true });

export const insertCloverConfigSchema = createInsertSchema(cloverConfig)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransaction)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertEmailNotificationLogSchema = createInsertSchema(emailNotificationLog)
  .omit({ id: true, sentAt: true });

// Types for insert and select
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBoatOwner = z.infer<typeof insertBoatOwnerSchema>;
export type BoatOwner = typeof boatOwner.$inferSelect;

export type InsertBoat = z.infer<typeof insertBoatSchema>;
export type Boat = typeof boat.$inferSelect;

export type InsertMarina = z.infer<typeof insertMarinaSchema>;
export type Marina = typeof marina.$inferSelect;

export type InsertDockAssignment = z.infer<typeof insertDockAssignmentSchema>;
export type DockAssignment = typeof dockAssignment.$inferSelect;

export type InsertServiceLevel = z.infer<typeof insertServiceLevelSchema>;
export type ServiceLevel = typeof serviceLevel.$inferSelect;

export type InsertPumpOutRequest = z.infer<typeof insertPumpOutRequestSchema>;
export type PumpOutRequest = typeof pumpOutRequest.$inferSelect;

export type InsertPumpOutLog = z.infer<typeof insertPumpOutLogSchema>;
export type PumpOutLog = typeof pumpOutLog.$inferSelect;

export type InsertEmployeeAssignment = z.infer<typeof insertEmployeeAssignmentSchema>;
export type EmployeeAssignment = typeof employeeAssignment.$inferSelect;

export type InsertCloverConfig = z.infer<typeof insertCloverConfigSchema>;
export type CloverConfig = typeof cloverConfig.$inferSelect;

export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransaction.$inferSelect;

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

export type InsertEmailNotificationLog = z.infer<typeof insertEmailNotificationLogSchema>;
export type EmailNotificationLog = typeof emailNotificationLog.$inferSelect;
