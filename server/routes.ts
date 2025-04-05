import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { DBStorage } from "./db-storage";
import { 
  insertUserSchema, 
  insertFriendConnectionSchema, 
  insertQuestionResponseSchema,
  insertMessageSchema,
  insertActivitySchema,
  insertQuestionSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Create a storage instance
const storage = new DBStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsedUser = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(parsedUser.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingUsername = await storage.getUserByUsername(parsedUser.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Create a new user
      const newUser = await storage.createUser(parsedUser);
      const { password, ...userWithoutPassword } = newUser;
      
      // Set user session
      if (req.session) {
        req.session.userId = newUser.id;
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      // Set user session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
  
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // User routes
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // Friend connection routes
  app.get("/api/friends", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const connections = await storage.getFriendConnections(req.session.userId);
      
      // Get full user details for each friend
      const friendsWithDetails = await Promise.all(
        connections.map(async (connection) => {
          const friendId = connection.userId === req.session!.userId 
            ? connection.friendId 
            : connection.userId;
          
          const friend = await storage.getUser(friendId);
          
          if (!friend) {
            return null;
          }
          
          const { password, ...friendWithoutPassword } = friend;
          
          return {
            ...connection,
            friend: friendWithoutPassword
          };
        })
      );
      
      res.json(friendsWithDetails.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: "Failed to get friends" });
    }
  });
  
  app.post("/api/friends", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { friendEmail } = req.body;
      
      if (!friendEmail) {
        return res.status(400).json({ message: "Friend email is required" });
      }
      
      // Find the friend by email
      const friend = await storage.getUserByEmail(friendEmail);
      
      if (!friend) {
        return res.status(404).json({ message: "User with this email not found" });
      }
      
      if (friend.id === req.session.userId) {
        return res.status(400).json({ message: "You cannot add yourself as a friend" });
      }
      
      // Check if connection already exists
      const existingConnection = await storage.getFriendConnection(req.session.userId, friend.id);
      
      if (existingConnection) {
        return res.status(400).json({ message: "Friend connection already exists" });
      }
      
      // Create the friend connection
      const connection = await storage.createFriendConnection({
        userId: req.session.userId,
        friendId: friend.id,
        status: "pending",
        level: 1,
        progress: 0
      });
      
      // Get friend details
      const { password, ...friendWithoutPassword } = friend;
      
      res.status(201).json({
        ...connection,
        friend: friendWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add friend" });
    }
  });
  
  app.put("/api/friends/:id/status", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const connectionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(connectionId)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      if (!status || !["accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      // Update connection status
      const updatedConnection = await storage.updateFriendConnection(connectionId, { status });
      
      // Get friend details
      const friendId = updatedConnection.userId === req.session.userId 
        ? updatedConnection.friendId 
        : updatedConnection.userId;
        
      const friend = await storage.getUser(friendId);
      
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
      
      const { password, ...friendWithoutPassword } = friend;
      
      res.json({
        ...updatedConnection,
        friend: friendWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update friend status" });
    }
  });
  
  // Question category routes
  app.get("/api/question-categories", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const categories = await storage.getQuestionCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get question categories" });
    }
  });
  
  // Question routes
  app.get("/api/questions", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      
      const questions = await storage.getQuestions(categoryId, level);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get questions" });
    }
  });
  
  // Create a new question
  app.post("/api/questions", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate the request body
      const parsedQuestion = insertQuestionSchema.parse(req.body);
      
      // Create the question
      const question = await storage.createQuestion(parsedQuestion);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid question data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });
  
  app.get("/api/questions/random", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const level = req.query.level ? parseInt(req.query.level as string) : undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      const question = await storage.getRandomQuestion(level, categoryId);
      
      if (!question) {
        return res.status(404).json({ message: "No questions found" });
      }
      
      // Get the category for this question
      const category = await storage.getQuestionCategory(question.categoryId);
      
      res.json({
        ...question,
        category
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get random question" });
    }
  });
  
  // Question response routes
  app.post("/api/question-responses", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsedResponse = insertQuestionResponseSchema.parse({
        ...req.body,
        userId: req.session.userId
      });
      
      const response = await storage.createQuestionResponse(parsedResponse);
      
      // Create activity for each friend that the response is shared with
      const sharedWith = parsedResponse.sharedWith as number[];
      
      if (sharedWith && sharedWith.length > 0) {
        const question = await storage.getQuestion(parsedResponse.questionId);
        
        if (question) {
          for (const friendId of sharedWith) {
            await storage.createActivity({
              userId: friendId,
              friendId: req.session.userId,
              type: 'question_answered',
              contentId: question.id,
              content: question.text
            });
          }
        }
      }
      
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to save question response" });
    }
  });
  
  app.get("/api/question-responses/shared", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const responses = await storage.getSharedResponses(req.session.userId);
      
      // Get question details for each response
      const responsesWithDetails = await Promise.all(
        responses.map(async (response) => {
          const question = await storage.getQuestion(response.questionId);
          const user = await storage.getUser(response.userId);
          
          if (!question || !user) {
            return null;
          }
          
          const { password, ...userWithoutPassword } = user;
          
          return {
            ...response,
            question,
            user: userWithoutPassword
          };
        })
      );
      
      res.json(responsesWithDetails.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: "Failed to get shared responses" });
    }
  });
  
  // Message routes
  app.get("/api/messages/:friendId", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const friendId = parseInt(req.params.friendId);
      
      if (isNaN(friendId)) {
        return res.status(400).json({ message: "Invalid friend ID" });
      }
      
      const messages = await storage.getMessages(req.session.userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsedMessage = insertMessageSchema.parse({
        ...req.body,
        senderId: req.session.userId
      });
      
      const message = await storage.createMessage(parsedMessage);
      
      // Create activity for the recipient
      await storage.createActivity({
        userId: parsedMessage.receiverId,
        friendId: req.session.userId,
        type: 'message_sent',
        content: parsedMessage.content.substring(0, 50) + (parsedMessage.content.length > 50 ? '...' : '')
      });
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  app.put("/api/messages/:id/read", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.id);
      
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      await storage.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  // Activity routes
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const activities = await storage.getUserActivities(req.session.userId);
      
      // Get friend details for each activity
      const activitiesWithDetails = await Promise.all(
        activities.map(async (activity) => {
          const friend = await storage.getUser(activity.friendId);
          
          if (!friend) {
            return null;
          }
          
          const { password, ...friendWithoutPassword } = friend;
          
          return {
            ...activity,
            friend: friendWithoutPassword
          };
        })
      );
      
      res.json(activitiesWithDetails.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
