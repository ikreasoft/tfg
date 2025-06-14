import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  userId: integer("user_id").notNull(),
  isActive: boolean("is_active").notNull().default(false)
});

export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // rtsp, http, etc.
  username: text("username"),
  password: text("password"),
  config: jsonb("config").$type<{
    resolution?: string;
    framerate?: number;
    quality?: number;
  }>(),
  userId: integer("user_id").notNull(),
  isActive: boolean("is_active").notNull().default(false)
});

export const sensors = pgTable("sensors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // temperature, humidity, motion, etc.
  config: jsonb("config").$type<{
    protocol: string;
    address: string;
    interval: number;
    unit?: string;
    events?: Array<{
      timestamp: string;
      detected: boolean;
      value?: number;
    }>;
  }>(),
  userId: integer("user_id").notNull(),
  isActive: boolean("is_active").notNull().default(true)
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true
});

export const insertSensorSchema = createInsertSchema(sensors).omit({
  id: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Sensor = typeof sensors.$inferSelect;
export type InsertSensor = z.infer<typeof insertSensorSchema>;
