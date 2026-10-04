import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  real,
} from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  emailVerified: boolean("emailVerified").default(false),
  passwordHash: varchar("passwordHash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  phoneVerified: boolean("phoneVerified").default(false),
  googleId: varchar("googleId", { length: 128 }),
  facebookId: varchar("facebookId", { length: 128 }),
  appleId: varchar("appleId", { length: 128 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  authProvider: varchar("authProvider", { enum: ["manus", "email", "google", "facebook", "apple", "phone"] }).default("manus"),
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
  emailVerifyExpiry: timestamp("emailVerifyExpiry"),
  role: varchar("role", { enum: ["user", "admin"] }).default("user").notNull(),
  userType: varchar("userType", { enum: ["requester", "correspondent", "both"] }).default("requester"),
  trustLevel: varchar("trustLevel", { enum: ["explorer", "trusted", "elite", "ambassador"] }).default("explorer"),
  totalMissions: integer("totalMissions").default(0),
  averageRating: real("averageRating").default(0),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Missions table — core entity of the Movo marketplace.
 */
/**
 * Service categories — built-in + user-defined categories.
 */
export const serviceCategories = pgTable("service_categories", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }).default("briefcase"),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  createdBy: integer("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type InsertServiceCategory = typeof serviceCategories.$inferInsert;

export const missions = pgTable("missions", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  requesterId: integer("requesterId").notNull(),
  correspondentId: integer("correspondentId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 128 }).notNull().default("other"),
  customCategoryId: integer("customCategoryId"),
  customServiceName: varchar("customServiceName", { length: 255 }),
  customServiceDescription: text("customServiceDescription"),
  status: varchar("status", { enum: [
    "open",
    "in_progress",
    "completed",
    "cancelled",
  ] })
    .default("open")
    .notNull(),
  urgency: varchar("urgency", { enum: ["low", "medium", "high", "urgent"] }).default("medium"),
  location: varchar("location", { length: 500 }).notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  deadline: timestamp("deadline"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  aiGuidance: text("aiGuidance"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

/**
 * Mission applications — correspondents apply to missions.
 */
export const missionApplications = pgTable("mission_applications", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  missionId: integer("missionId").notNull(),
  correspondentId: integer("correspondentId").notNull(),
  message: text("message"),
  status: varchar("status", { enum: ["pending", "accepted", "rejected"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type MissionApplication = typeof missionApplications.$inferSelect;
export type InsertMissionApplication = typeof missionApplications.$inferInsert;

/**
 * Consent-based remote assistance between the two participants of an active mission.
 * The recipient must explicitly accept before guidance can be exchanged.
 */
export const missionAssistanceRequests = pgTable("mission_assistance_requests", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  missionId: integer("missionId").notNull(),
  requesterId: integer("requesterId").notNull(),
  recipientId: integer("recipientId").notNull(),
  note: varchar("note", { length: 500 }),
  status: varchar("status", { enum: ["pending", "accepted", "declined", "closed"] })
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  closedAt: timestamp("closedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type MissionAssistanceRequest = typeof missionAssistanceRequests.$inferSelect;
export type InsertMissionAssistanceRequest = typeof missionAssistanceRequests.$inferInsert;

/**
 * Short written guidance kept inside a consented assistance request.
 * No media, device location, screen sharing, or contacts are included by default.
 */
export const missionAssistanceGuidance = pgTable("mission_assistance_guidance", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  assistanceRequestId: integer("assistanceRequestId").notNull(),
  senderId: integer("senderId").notNull(),
  content: varchar("content", { length: 1000 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MissionAssistanceGuidance = typeof missionAssistanceGuidance.$inferSelect;
export type InsertMissionAssistanceGuidance = typeof missionAssistanceGuidance.$inferInsert;

/** Dispositivos que consentiram em receber alertas remotos neutros. */
export const pushDevices = pgTable("push_devices", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  expoPushToken: varchar("expoPushToken", { length: 255 }).notNull(),
  platform: varchar("platform", { enum: ["android", "ios"] }).notNull(),
  deliveryMode: varchar("deliveryMode", { enum: ["remote", "in_app"] }).default("remote").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Chat messages — per mission conversation.
 */
export const chatMessages = pgTable("chat_messages", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  missionId: integer("missionId").notNull(),
  senderId: integer("senderId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Custody steps — digital chain of custody for mission execution.
 */
export const custodySteps = pgTable("custody_steps", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  missionId: integer("missionId").notNull(),
  correspondentId: integer("correspondentId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  photoUrl: text("photoUrl"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: varchar("locationName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustodyStep = typeof custodySteps.$inferSelect;
export type InsertCustodyStep = typeof custodySteps.$inferInsert;

/**
 * Reviews — mutual ratings after mission completion.
 * Both requester and correspondent evaluate each other.
 */
export const reviews = pgTable("reviews", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  missionId: integer("missionId").notNull(),
  reviewerId: integer("reviewerId").notNull(),
  revieweeId: integer("revieweeId").notNull(),
  // Role of the reviewer: 'requester' evaluates correspondent, 'correspondent' evaluates requester
  reviewerRole: varchar("reviewerRole", { length: 20 }).notNull().default("requester"),
  // Overall rating 1-5
  rating: integer("rating").notNull(),
  // Specific criteria (1-5 each)
  ratingPunctuality: integer("ratingPunctuality"),    // pontualidade
  ratingCommunication: integer("ratingCommunication"), // comunicação
  ratingQuality: integer("ratingQuality"),             // qualidade do serviço
  ratingProfessionalism: integer("ratingProfessionalism"), // profissionalismo
  // For correspondent rating requester:
  ratingClarity: integer("ratingClarity"),             // clareza das instruções
  ratingPayment: integer("ratingPayment"),             // pagamento em dia
  comment: text("comment"),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Notifications — in-app notifications.
 */
export const notifications = pgTable("notifications", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { enum: [
    "mission_applied",
    "application_accepted",
    "application_rejected",
    "mission_completed",
    "new_message",
    "new_review",
    "support",
    "assistance_request",
    "assistance_response",
    "assistance_guidance",
  ] }).notNull(),
  relatedId: integer("relatedId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Support tickets — customer support system.
 */
export const supportTickets = pgTable("support_tickets", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  userId: integer("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] })
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support messages — messages within a support ticket.
 */
export const supportMessages = pgTable("support_messages", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  ticketId: integer("ticketId").notNull(),
  senderId: integer("senderId").notNull(),
  content: text("content").notNull(),
  isStaff: boolean("isStaff").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/** Tombstones retained for account-deletion auditing. */
export const deletedAccounts = pgTable("deleted_accounts", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull(),
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
});

export type DeletedAccount = typeof deletedAccounts.$inferSelect;
export type InsertDeletedAccount = typeof deletedAccounts.$inferInsert;
