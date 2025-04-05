import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatarColor: text("avatar_color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Friend connection schema
export const friendConnections = pgTable("friend_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  level: integer("level").notNull().default(1),
  progress: integer("progress").notNull().default(0), // percentage of level completion (0-100)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFriendConnectionSchema = createInsertSchema(friendConnections).omit({
  id: true,
  createdAt: true,
});

// Question categories schema
export const questionCategories = pgTable("question_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  colorClass: text("color_class").notNull(),
});

export const insertQuestionCategorySchema = createInsertSchema(questionCategories).omit({
  id: true,
});

// Questions schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  categoryId: integer("category_id").notNull().references(() => questionCategories.id),
  level: integer("level").notNull().default(1),
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

// Question responses schema
export const questionResponses = pgTable("question_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => questions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  response: text("response").notNull(),
  sharedWith: jsonb("shared_with").notNull(), // array of user IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestionResponseSchema = createInsertSchema(questionResponses).omit({
  id: true,
  createdAt: true,
});

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Activity schema for tracking friend activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  type: text("type").notNull(), // question_answered, message_sent, etc.
  contentId: integer("content_id"), // ID reference to the question, message, etc.
  content: text("content"), // Optional content preview
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Type definitions for all schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FriendConnection = typeof friendConnections.$inferSelect;
export type InsertFriendConnection = z.infer<typeof insertFriendConnectionSchema>;

export type QuestionCategory = typeof questionCategories.$inferSelect;
export type InsertQuestionCategory = z.infer<typeof insertQuestionCategorySchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuestionResponse = typeof questionResponses.$inferSelect;
export type InsertQuestionResponse = z.infer<typeof insertQuestionResponseSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
