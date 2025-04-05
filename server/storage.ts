import {
  users,
  friendConnections,
  questionCategories,
  questions,
  questionResponses,
  messages,
  activities
} from "@shared/schema";

import type { 
  User, InsertUser,
  FriendConnection, InsertFriendConnection,
  QuestionCategory, InsertQuestionCategory,
  Question, InsertQuestion,
  QuestionResponse, InsertQuestionResponse,
  Message, InsertMessage,
  Activity, InsertActivity 
} from "../shared/schema";

// Re-export types and schemas for the DB storage implementation
export {
  users, 
  friendConnections, 
  questionCategories, 
  questions, 
  questionResponses, 
  messages, 
  activities
};
export type { 
  User, InsertUser,
  FriendConnection, InsertFriendConnection,
  QuestionCategory, InsertQuestionCategory,
  Question, InsertQuestion,
  QuestionResponse, InsertQuestionResponse,
  Message, InsertMessage,
  Activity, InsertActivity 
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Friend connection operations
  getFriendConnections(userId: number): Promise<FriendConnection[]>;
  getFriendConnection(userId: number, friendId: number): Promise<FriendConnection | undefined>;
  createFriendConnection(connection: InsertFriendConnection): Promise<FriendConnection>;
  updateFriendConnection(id: number, connection: Partial<FriendConnection>): Promise<FriendConnection>;
  
  // Question category operations
  getQuestionCategories(): Promise<QuestionCategory[]>;
  getQuestionCategory(id: number): Promise<QuestionCategory | undefined>;
  createQuestionCategory(category: InsertQuestionCategory): Promise<QuestionCategory>;
  
  // Question operations
  getQuestions(categoryId?: number, level?: number): Promise<Question[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  getRandomQuestion(level?: number, categoryId?: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Question response operations
  getQuestionResponses(questionId: number, userId: number): Promise<QuestionResponse[]>;
  getSharedResponses(userId: number): Promise<QuestionResponse[]>;
  createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse>;
  
  // Message operations
  getMessages(userId: number, friendId: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Activity operations
  getUserActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private friendConnections: Map<number, FriendConnection>;
  private questionCategories: Map<number, QuestionCategory>;
  private questions: Map<number, Question>;
  private questionResponses: Map<number, QuestionResponse>;
  private messages: Map<number, Message>;
  private activities: Map<number, Activity>;
  
  private userId: number;
  private friendConnectionId: number;
  private questionCategoryId: number;
  private questionId: number;
  private questionResponseId: number;
  private messageId: number;
  private activityId: number;
  
  constructor() {
    this.users = new Map();
    this.friendConnections = new Map();
    this.questionCategories = new Map();
    this.questions = new Map();
    this.questionResponses = new Map();
    this.messages = new Map();
    this.activities = new Map();
    
    this.userId = 1;
    this.friendConnectionId = 1;
    this.questionCategoryId = 1;
    this.questionId = 1;
    this.questionResponseId = 1;
    this.messageId = 1;
    this.activityId = 1;
    
    this.initializeSampleData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }
  
  // Friend connection operations
  async getFriendConnections(userId: number): Promise<FriendConnection[]> {
    return Array.from(this.friendConnections.values()).filter(
      (conn) => conn.userId === userId || conn.friendId === userId
    );
  }
  
  async getFriendConnection(userId: number, friendId: number): Promise<FriendConnection | undefined> {
    return Array.from(this.friendConnections.values()).find(
      (conn) => 
        (conn.userId === userId && conn.friendId === friendId) || 
        (conn.userId === friendId && conn.friendId === userId)
    );
  }
  
  async createFriendConnection(connection: InsertFriendConnection): Promise<FriendConnection> {
    const id = this.friendConnectionId++;
    const createdAt = new Date();
    // Ensure required fields have default values if not provided
    const newConnection: FriendConnection = { 
      ...connection, 
      id, 
      createdAt,
      status: connection.status || 'pending',
      level: connection.level || 1,
      progress: connection.progress || 0
    };
    this.friendConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateFriendConnection(id: number, updates: Partial<FriendConnection>): Promise<FriendConnection> {
    const connection = this.friendConnections.get(id);
    if (!connection) {
      throw new Error(`Friend connection with id ${id} not found`);
    }
    
    const updatedConnection = { ...connection, ...updates };
    this.friendConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  // Question category operations
  async getQuestionCategories(): Promise<QuestionCategory[]> {
    return Array.from(this.questionCategories.values());
  }
  
  async getQuestionCategory(id: number): Promise<QuestionCategory | undefined> {
    return this.questionCategories.get(id);
  }
  
  async createQuestionCategory(category: InsertQuestionCategory): Promise<QuestionCategory> {
    const id = this.questionCategoryId++;
    const newCategory: QuestionCategory = { ...category, id };
    this.questionCategories.set(id, newCategory);
    return newCategory;
  }
  
  // Question operations
  async getQuestions(categoryId?: number, level?: number): Promise<Question[]> {
    let filteredQuestions = Array.from(this.questions.values());
    
    if (categoryId !== undefined) {
      filteredQuestions = filteredQuestions.filter(q => q.categoryId === categoryId);
    }
    
    if (level !== undefined) {
      filteredQuestions = filteredQuestions.filter(q => q.level === level);
    }
    
    return filteredQuestions;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }
  
  async getRandomQuestion(level?: number, categoryId?: number): Promise<Question | undefined> {
    const questions = await this.getQuestions(categoryId, level);
    if (questions.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = this.questionId++;
    const newQuestion: Question = { 
      ...question, 
      id,
      level: question.level || 1 
    };
    this.questions.set(id, newQuestion);
    return newQuestion;
  }
  
  // Question response operations
  async getQuestionResponses(questionId: number, userId: number): Promise<QuestionResponse[]> {
    return Array.from(this.questionResponses.values()).filter(
      (response) => response.questionId === questionId && response.userId === userId
    );
  }
  
  async getSharedResponses(userId: number): Promise<QuestionResponse[]> {
    return Array.from(this.questionResponses.values()).filter(
      (response) => {
        const sharedWith = response.sharedWith as number[];
        return sharedWith.includes(userId) || response.userId === userId;
      }
    );
  }
  
  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const id = this.questionResponseId++;
    const createdAt = new Date();
    const newResponse: QuestionResponse = { ...response, id, createdAt };
    this.questionResponses.set(id, newResponse);
    return newResponse;
  }
  
  // Message operations
  async getMessages(userId: number, friendId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === userId && message.receiverId === friendId) || 
        (message.senderId === friendId && message.receiverId === userId)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      (message) => message.receiverId === userId && !message.read
    ).length;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const createdAt = new Date();
    const newMessage: Message = { ...message, id, read: false, createdAt };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messages.get(id);
    if (message) {
      message.read = true;
      this.messages.set(id, message);
    }
  }
  
  // Activity operations
  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const createdAt = new Date();
    const newActivity: Activity = { 
      ...activity, 
      id, 
      createdAt,
      content: activity.content || null,
      contentId: activity.contentId || null
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  // Initialize sample data for the app
  private initializeSampleData() {
    // Create default user
    const defaultUser: InsertUser = {
      username: 'alex',
      password: 'password123',
      email: 'alex@example.com',
      fullName: 'Alex Johnson',
      avatarColor: 'bg-gradient-to-r from-primary-400 to-secondary-400',
    };
    const user = this.createUser(defaultUser);
    
    // Create sample friends
    const friend1: InsertUser = {
      username: 'sarah',
      password: 'password123',
      email: 'sarah@example.com',
      fullName: 'Sarah Thompson',
      avatarColor: 'bg-secondary-100',
    };
    const friend2: InsertUser = {
      username: 'jamie',
      password: 'password123',
      email: 'jamie@example.com',
      fullName: 'Jamie Cruz',
      avatarColor: 'bg-accent-100',
    };
    const friend3: InsertUser = {
      username: 'mike',
      password: 'password123',
      email: 'mike@example.com',
      fullName: 'Mike Rivera',
      avatarColor: 'bg-primary-100',
    };
    
    // Add friends to storage
    Promise.all([
      this.createUser(friend1),
      this.createUser(friend2),
      this.createUser(friend3)
    ]).then(([sarah, jamie, mike]) => {
      // Create friend connections
      Promise.all([
        this.createFriendConnection({
          userId: 1,
          friendId: sarah.id,
          status: 'accepted',
          level: 1,
          progress: 70
        }),
        this.createFriendConnection({
          userId: 1,
          friendId: jamie.id,
          status: 'accepted',
          level: 1,
          progress: 40
        }),
        this.createFriendConnection({
          userId: 1,
          friendId: mike.id,
          status: 'accepted',
          level: 1,
          progress: 80
        })
      ]);
    });
    
    // Create question categories
    const categories = [
      {
        name: 'Personal History',
        description: 'Childhood memories, family stories, and formative experiences',
        iconName: 'book-open',
        colorClass: 'bg-secondary-100'
      },
      {
        name: 'Values & Beliefs',
        description: 'Core principles, worldviews, and philosophical perspectives',
        iconName: 'map',
        colorClass: 'bg-primary-100'
      },
      {
        name: 'Hypotheticals',
        description: 'Thought experiments, creative scenarios, and what-ifs',
        iconName: 'sparkles',
        colorClass: 'bg-accent-100'
      },
      {
        name: 'Aspirations & Dreams',
        description: 'Goals, ambitions, bucket list items, and future hopes',
        iconName: 'target',
        colorClass: 'bg-secondary-100'
      },
      {
        name: 'Preferences & Favorites',
        description: 'Tastes in entertainment, food, activities, etc.',
        iconName: 'heart',
        colorClass: 'bg-accent-100'
      },
      {
        name: 'Work & Purpose',
        description: 'Career reflections, meaning, contribution',
        iconName: 'briefcase',
        colorClass: 'bg-primary-100'
      },
      {
        name: 'Current Life',
        description: 'Day-to-day experiences, recent insights, present circumstances',
        iconName: 'calendar',
        colorClass: 'bg-secondary-100'
      }
    ];
    
    categories.forEach(category => {
      this.createQuestionCategory(category);
    });
    
    // Create sample questions
    const questions = [
      // Personal History
      {
        text: "What's a childhood memory that still makes you smile?",
        categoryId: 1,
        level: 1
      },
      {
        text: "What was your favorite toy or game growing up?",
        categoryId: 1,
        level: 1
      },
      {
        text: "Who was your childhood hero and why?",
        categoryId: 1,
        level: 1
      },
      
      // Values & Beliefs
      {
        text: "What's one principle you try to live by?",
        categoryId: 2,
        level: 1
      },
      {
        text: "What value do you wish more people embraced?",
        categoryId: 2,
        level: 1
      },
      {
        text: "What's something you've changed your mind about in the last few years?",
        categoryId: 2,
        level: 1
      },
      
      // Hypotheticals
      {
        text: "If you could live in any fictional world, which would you choose and why?",
        categoryId: 3,
        level: 1
      },
      {
        text: "If you had to teach a class on any subject, what would it be?",
        categoryId: 3,
        level: 1
      },
      {
        text: "If you could have dinner with anyone from history, who would it be?",
        categoryId: 3,
        level: 1
      },
      
      // Aspirations & Dreams
      {
        text: "If you could master any skill instantly, what would it be?",
        categoryId: 4,
        level: 1
      },
      {
        text: "What's something you want to accomplish in the next year?",
        categoryId: 4,
        level: 1
      },
      {
        text: "What's a place you've always wanted to visit?",
        categoryId: 4,
        level: 1
      },
      
      // Preferences & Favorites
      {
        text: "What's your favorite way to spend a rainy day?",
        categoryId: 5,
        level: 1
      },
      {
        text: "What book, movie, or show do you find yourself recommending most often?",
        categoryId: 5,
        level: 1
      },
      {
        text: "What's your comfort food and is there a story behind it?",
        categoryId: 5,
        level: 1
      },
      
      // Work & Purpose
      {
        text: "What aspect of your job/studies brings you the most satisfaction?",
        categoryId: 6,
        level: 1
      },
      {
        text: "What's a work challenge you're proud of overcoming?",
        categoryId: 6,
        level: 1
      },
      {
        text: "What would your ideal workday look like?",
        categoryId: 6,
        level: 1
      },
      
      // Current Life
      {
        text: "What are three things you're grateful for today?",
        categoryId: 7,
        level: 1
      },
      {
        text: "What's something small that brought you joy recently?",
        categoryId: 7,
        level: 1
      },
      {
        text: "What hobby or activity have you been enjoying lately?",
        categoryId: 7,
        level: 1
      }
    ];
    
    // Create the questions and keep track of their IDs
    const questionPromises = questions.map(question => this.createQuestion(question));
    
    Promise.all(questionPromises).then(createdQuestions => {
      // Create sample question responses from the sample users
      const responsePromises = [
        // Sarah's responses
        this.createQuestionResponse({
          questionId: 1, // Childhood memory question
          userId: 2,
          response: "Building blanket forts with my siblings during rainy days. We'd spend hours creating elaborate 'buildings' with secret rooms and passages.",
          sharedWith: [1, 3] // Shared with default user and Mike
        }),
        
        this.createQuestionResponse({
          questionId: 7, // Fictional world question
          userId: 2,
          response: "I'd choose the world of Avatar: The Last Airbender. The idea of bending elements is fascinating, and the show has such rich cultures and philosophies.",
          sharedWith: [1]
        }),
        
        // Jamie's responses
        this.createQuestionResponse({
          questionId: 4, // Principle to live by
          userId: 3,
          response: "Leave things better than you found them - whether that's a physical space, a project, or a relationship.",
          sharedWith: [1, 2, 4]
        }),
        
        this.createQuestionResponse({
          questionId: 10, // Master any skill
          userId: 3,
          response: "Playing the piano. I've always loved piano music, and it seems like a skill that brings joy to both the player and listeners for a lifetime.",
          sharedWith: [1]
        }),
        
        // Mike's responses
        this.createQuestionResponse({
          questionId: 19, // Grateful for today
          userId: 4,
          response: "1. My morning coffee - it was perfect today. 2. A call with an old friend I hadn't spoken to in months. 3. The sunset I caught while walking home.",
          sharedWith: [1, 2]
        }),
        
        this.createQuestionResponse({
          questionId: 13, // Rainy day
          userId: 4,
          response: "Reading by the window with a cup of tea, listening to the rain. There's something incredibly peaceful about being cozy indoors while it's storming outside.",
          sharedWith: [1, 3]
        })
      ];
      
      return Promise.all(responsePromises);
    }).then(() => {
      // Create sample messages
      const now = new Date();
      const messagePromises = [
        // Conversation with Sarah
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 2, // Sarah
          content: "Hey Sarah! I saw your answer about blanket forts - that brought back memories!"
        }),
        this.createMessage({
          senderId: 2, // Sarah
          receiverId: 1, // Default user
          content: "Haha, glad to hear it! Did you build forts as a kid too?"
        }),
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 2, // Sarah
          content: "Absolutely! With every blanket and pillow I could find. My parents weren't always thrilled though 😄"
        }),
        this.createMessage({
          senderId: 2, // Sarah
          receiverId: 1, // Default user
          content: "Same here! We should plan an adult fort-building day sometime for nostalgia's sake."
        }),
        
        // Conversation with Jamie
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 3, // Jamie
          content: "I really liked your principle about leaving things better than you found them. Do you have any examples of how you apply that day-to-day?"
        }),
        this.createMessage({
          senderId: 3, // Jamie
          receiverId: 1, // Default user
          content: "Thanks! It can be little things like tidying up a meeting room after using it, or bigger things like mentoring someone at work. It helps me stay mindful."
        }),
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 3, // Jamie
          content: "That's a great perspective. I might adopt that principle too!"
        }),
        
        // Conversation with Mike
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 4, // Mike
          content: "Hey! Let's catch up this weekend. Are you free?"
        }),
        this.createMessage({
          senderId: 4, // Mike
          receiverId: 1, // Default user
          content: "I'm free on Saturday afternoon! Want to grab coffee?"
        }),
        this.createMessage({
          senderId: 1, // Default user
          receiverId: 4, // Mike
          content: "Perfect! How about that new place downtown, around 2pm?"
        }),
        this.createMessage({
          senderId: 4, // Mike
          receiverId: 1, // Default user
          content: "Sounds great! Looking forward to it."
        })
      ];
      
      return Promise.all(messagePromises);
    }).then(() => {
      // Create sample activities
      return Promise.all([
        this.createActivity({
          userId: 1,
          friendId: 2,
          type: 'question_answered',
          contentId: 1,
          content: "Building blanket forts with my siblings during rainy days..."
        }),
        this.createActivity({
          userId: 1,
          friendId: 3,
          type: 'question_asked',
          contentId: 10,
          content: "If you could master any skill instantly, what would it be?"
        }),
        this.createActivity({
          userId: 1,
          friendId: 4,
          type: 'message_sent',
          content: "Hey! Let's catch up this weekend. Are you free?"
        }),
        this.createActivity({
          userId: 1,
          friendId: 3,
          type: 'question_answered',
          contentId: 4,
          content: "Leave things better than you found them..."
        }),
        this.createActivity({
          userId: 1,
          friendId: 4,
          type: 'question_answered',
          contentId: 19,
          content: "1. My morning coffee - it was perfect today..."
        })
      ]);
    });
  }
}

export const storage = new MemStorage();
