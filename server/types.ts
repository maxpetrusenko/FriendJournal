// Extend the express-session type definitions
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}