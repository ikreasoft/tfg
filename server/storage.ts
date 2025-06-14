import { users, recordings, sensors, cameras, type User, type InsertUser, type Recording, type InsertRecording, type Sensor, type InsertSensor, type Camera, type InsertCamera } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  updateRecording(id: number, updates: Partial<Recording>): Promise<Recording>;
  getRecordings(userId: number): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  getSensors(userId: number): Promise<Sensor[]>;
  getSensor(id: number): Promise<Sensor | undefined>;
  createSensor(sensor: InsertSensor): Promise<Sensor>;
  updateSensor(id: number, updates: Partial<Sensor>): Promise<Sensor>;
  getCameras(userId: number): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, updates: Partial<Camera>): Promise<Camera>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private recordings: Map<number, Recording>;
  private sensors: Map<number, Sensor>;
  private cameras: Map<number, Camera>;
  private currentUserId: number;
  private currentRecordingId: number;
  private currentSensorId: number;
  private currentCameraId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.recordings = new Map();
    this.sensors = new Map();
    this.cameras = new Map();
    this.currentUserId = 1;
    this.currentRecordingId = 1;
    this.currentSensorId = 1;
    this.currentCameraId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add demo user
    this.createUser({ username: "demo", password: "password" }).then(user => {
      // Add some demo cameras for the demo user
      this.createCamera({
        name: "Lab Room 1",
        url: "rtsp://192.168.1.100:554",
        type: "rtsp",
        userId: user.id,
        config: {
          resolution: "1280x720",
          framerate: 30,
          quality: 80
        }
      });
      this.createCamera({
        name: "Lab Room 2",
        url: "rtsp://192.168.1.101:554",
        type: "rtsp",
        userId: user.id,
        config: {
          resolution: "1280x720",
          framerate: 30,
          quality: 80
        }
      });
      this.createCamera({
        name: "Main Corridor",
        url: "rtsp://192.168.1.102:80",
        type: "rtsp",
        userId: user.id,
        config: {
          resolution: "1280x720",
          framerate: 30,
          quality: 80
        }
      });

      // Add some demo sensors
      this.createSensor({
        name: "Temperature Sensor 1",
        type: "temperature",
        userId: user.id,
        config: {
          protocol: "mqtt",
          address: "sensor/temp/1",
          interval: 60,
          unit: "°C"
        }
      });
      this.createSensor({
        name: "Motion Sensor 1",
        type: "motion",
        userId: user.id,
        config: {
          protocol: "mqtt",
          address: "sensor/motion/1",
          interval: 1
        }
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.currentRecordingId++;
    const recording: Recording = {
      ...insertRecording,
      id,
      endTime: insertRecording.endTime || null,
      isActive: insertRecording.isActive !== undefined ? insertRecording.isActive : false
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async updateRecording(id: number, updates: Partial<Recording>): Promise<Recording> {
    const existing = this.recordings.get(id);
    if (!existing) {
      throw new Error(`Recording ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.recordings.set(id, updated);
    return updated;
  }

  async getRecordings(userId: number): Promise<Recording[]> {
    return Array.from(this.recordings.values())
      .filter(recording => recording.userId === userId)
      .sort((a, b) => {
        // Sort by start time (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async getSensors(userId: number): Promise<Sensor[]> {
    return Array.from(this.sensors.values())
      .filter(sensor => sensor.userId === userId)
      .sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  async getSensor(id: number): Promise<Sensor | undefined> {
    return this.sensors.get(id);
  }

  async createSensor(insertSensor: InsertSensor): Promise<Sensor> {
    const id = this.currentSensorId++;
    const sensor: Sensor = {
      ...insertSensor,
      id,
      isActive: insertSensor.isActive !== undefined ? insertSensor.isActive : true,
      config: (insertSensor.config as any) || {
        protocol: "mqtt",
        address: "default/sensor",
        interval: 60,
        unit: ""
      }
    };
    this.sensors.set(id, sensor);
    return sensor;
  }

  async updateSensor(id: number, updates: Partial<Sensor>): Promise<Sensor> {
    const existing = this.sensors.get(id);
    if (!existing) {
      throw new Error(`Sensor ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.sensors.set(id, updated);
    return updated;
  }

  async getCameras(userId: number): Promise<Camera[]> {
    return Array.from(this.cameras.values())
      .filter(camera => camera.userId === userId)
      .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.currentCameraId++;
    const defaultConfig = {
      resolution: '1280x720',
      framerate: 30,
      quality: 80
    };
    
    const camera = {
      ...insertCamera,
      id,
      isActive: insertCamera.isActive !== undefined ? insertCamera.isActive : true,
      username: insertCamera.username || null,
      password: insertCamera.password || null,
      config: (insertCamera.config as any) || defaultConfig
    } as Camera;
    
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, updates: Partial<Camera>): Promise<Camera> {
    const existing = this.cameras.get(id);
    if (!existing) {
      throw new Error(`Camera ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.cameras.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
