import pgPromise from 'pg-promise';
import { eq, and, or, desc } from 'drizzle-orm';
import {
  IStorage,
  users, 
  friendConnections, 
  questionCategories, 
  questions, 
  questionResponses, 
  messages, 
  activities
} from './storage';

import type {
  User, InsertUser,
  FriendConnection, InsertFriendConnection,
  QuestionCategory, InsertQuestionCategory,
  Question, InsertQuestion,
  QuestionResponse, InsertQuestionResponse,
  Message, InsertMessage,
  Activity, InsertActivity
} from './storage';
import { db } from './db';

// Define a type for friend data needed in the FriendConnection type
type FriendData = {
  id: number;
  fullName: string;
  username: string;
  avatarColor: string;
};

// Extended type that includes friend data
type ExtendedFriendConnection = Omit<FriendConnection, 'friend'> & {
  friend: FriendData;
};

export class DBStorage implements IStorage {
  constructor() {
    // Initialize the database schema and seed data
    this.initializeDatabase();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length ? results[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length ? results[0] : undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results.length ? results[0] : undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }
  
  // Friend connection operations
  async getFriendConnections(userId: number): Promise<FriendConnection[]> {
    // Get all friend connections where the user is either the userId
    const directConnections = await db.select().from(friendConnections)
      .where(eq(friendConnections.userId, userId));
    
    // For each connection, we need to load the friend's details
    const enrichedConnections: ExtendedFriendConnection[] = [];
    
    for (const conn of directConnections) {
      const friend = await this.getUser(conn.friendId);
      if (friend) {
        enrichedConnections.push({
          ...conn,
          friend: {
            id: friend.id,
            fullName: friend.fullName,
            username: friend.username,
            avatarColor: friend.avatarColor
          }
        });
      }
    }
    
    // Return as FriendConnection[] which should include the friend field
    return enrichedConnections as unknown as FriendConnection[];
  }
  
  async getFriendConnection(userId: number, friendId: number): Promise<FriendConnection | undefined> {
    const results = await db.select()
      .from(friendConnections)
      .where(
        or(
          and(
            eq(friendConnections.userId, userId),
            eq(friendConnections.friendId, friendId)
          ),
          and(
            eq(friendConnections.userId, friendId),
            eq(friendConnections.friendId, userId)
          )
        )
      );
    
    if (!results.length) return undefined;
    
    const conn = results[0];
    const friend = await this.getUser(conn.userId === userId ? conn.friendId : conn.userId);
    
    if (!friend) return undefined;
    
    const enrichedConnection: ExtendedFriendConnection = {
      ...conn,
      friend: {
        id: friend.id,
        fullName: friend.fullName,
        username: friend.username,
        avatarColor: friend.avatarColor
      }
    };
    
    return enrichedConnection as unknown as FriendConnection;
  }
  
  async createFriendConnection(connection: InsertFriendConnection): Promise<FriendConnection> {
    // Set default values if not provided
    const connectionWithDefaults = {
      ...connection,
      status: connection.status || 'pending',
      level: connection.level || 1,
      progress: connection.progress || 0
    };
    
    const results = await db.insert(friendConnections)
      .values(connectionWithDefaults)
      .returning();
    
    const conn = results[0];
    const friend = await this.getUser(conn.friendId);
    
    if (!friend) {
      throw new Error(`Friend with id ${conn.friendId} not found`);
    }
    
    const enrichedConnection: ExtendedFriendConnection = {
      ...conn,
      friend: {
        id: friend.id,
        fullName: friend.fullName,
        username: friend.username,
        avatarColor: friend.avatarColor
      }
    };
    
    return enrichedConnection as unknown as FriendConnection;
  }
  
  async updateFriendConnection(id: number, updates: Partial<FriendConnection>): Promise<FriendConnection> {
    // Remove friend property if present as it's not part of the DB schema
    const { friend, ...dbUpdates } = updates as any;
    
    const results = await db.update(friendConnections)
      .set(dbUpdates)
      .where(eq(friendConnections.id, id))
      .returning();
    
    const conn = results[0];
    const friendData = await this.getUser(conn.friendId);
    
    if (!friendData) {
      throw new Error(`Friend with id ${conn.friendId} not found`);
    }
    
    const enrichedConnection: ExtendedFriendConnection = {
      ...conn,
      friend: {
        id: friendData.id,
        fullName: friendData.fullName,
        username: friendData.username,
        avatarColor: friendData.avatarColor
      }
    };
    
    return enrichedConnection as unknown as FriendConnection;
  }
  
  // Question category operations
  async getQuestionCategories(): Promise<QuestionCategory[]> {
    return await db.select().from(questionCategories);
  }
  
  async getQuestionCategory(id: number): Promise<QuestionCategory | undefined> {
    const results = await db.select()
      .from(questionCategories)
      .where(eq(questionCategories.id, id));
    
    return results.length ? results[0] : undefined;
  }
  
  async createQuestionCategory(category: InsertQuestionCategory): Promise<QuestionCategory> {
    const results = await db.insert(questionCategories)
      .values(category)
      .returning();
    
    return results[0];
  }
  
  // Question operations
  async getQuestions(categoryId?: number, level?: number): Promise<Question[]> {
    let query = db.select().from(questions);
    
    if (categoryId !== undefined) {
      query = query.where(eq(questions.categoryId, categoryId));
    }
    
    if (level !== undefined) {
      query = query.where(eq(questions.level, level));
    }
    
    return await query;
  }
  
  async getQuestion(id: number): Promise<Question | undefined> {
    const results = await db.select()
      .from(questions)
      .where(eq(questions.id, id));
    
    return results.length ? results[0] : undefined;
  }
  
  async getRandomQuestion(level?: number, categoryId?: number): Promise<Question | undefined> {
    const allQuestions = await this.getQuestions(categoryId, level);
    
    if (allQuestions.length === 0) return undefined;
    
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    return allQuestions[randomIndex];
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const questionWithDefaults = {
      ...question,
      level: question.level || 1
    };
    
    const results = await db.insert(questions)
      .values(questionWithDefaults)
      .returning();
    
    return results[0];
  }
  
  // Question response operations
  async getQuestionResponses(questionId: number, userId: number): Promise<QuestionResponse[]> {
    return await db.select()
      .from(questionResponses)
      .where(
        and(
          eq(questionResponses.questionId, questionId),
          eq(questionResponses.userId, userId)
        )
      );
  }
  
  async getSharedResponses(userId: number): Promise<QuestionResponse[]> {
    // This is a bit tricky with SQL, so we'll fetch all responses and filter in-memory
    const allResponses = await db.select().from(questionResponses);
    
    return allResponses.filter((response: QuestionResponse) => {
      const sharedWith = response.sharedWith as number[];
      return sharedWith.includes(userId) || response.userId === userId;
    });
  }
  
  async createQuestionResponse(response: InsertQuestionResponse): Promise<QuestionResponse> {
    const results = await db.insert(questionResponses)
      .values(response)
      .returning();
    
    return results[0];
  }
  
  // Message operations
  async getMessages(userId: number, friendId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, friendId)
          ),
          and(
            eq(messages.senderId, friendId),
            eq(messages.receiverId, userId)
          )
        )
      )
      .orderBy(messages.createdAt);
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    const unreadMessages = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.read, false)
        )
      );
    
    return unreadMessages.length;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const results = await db.insert(messages)
      .values({ ...message, read: false })
      .returning();
    
    return results[0];
  }
  
  async markMessageAsRead(id: number): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
  }
  
  // Activity operations
  async getUserActivities(userId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt));
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const activityWithDefaults = {
      ...activity,
      content: activity.content || null,
      contentId: activity.contentId || null
    };
    
    const results = await db.insert(activities)
      .values(activityWithDefaults)
      .returning();
    
    return results[0];
  }
  
  // Helper methods
  private async initializeDatabase() {
    try {
      // Connect directly with pg-promise to run raw SQL
      const pgp = pgPromise();
      const pgDb = pgp(process.env.DATABASE_URL!);
      
      // Check if schema already exists
      const tableExists = await pgDb.oneOrNone(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'users'
        );
      `);
      
      if (tableExists && tableExists.exists) {
        console.log('Database schema already exists');
        return;
      }
      
      console.log('Creating database schema...');
      
      // Create schema tables
      await this.createSchemaWithRawSQL(pgDb);
      
      // Seed initial data
      await this.seedInitialData();
      
      console.log('Database schema and seed data created successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
  
  private async createSchemaWithRawSQL(db: any) {
    // Users table
    await db.none(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Friend connections table
    await db.none(`
      CREATE TABLE friend_connections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        friend_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        level INTEGER NOT NULL DEFAULT 1,
        progress INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Question categories table
    await db.none(`
      CREATE TABLE question_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        color_class TEXT NOT NULL
      );
    `);
    
    // Questions table
    await db.none(`
      CREATE TABLE questions (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        category_id INTEGER NOT NULL REFERENCES question_categories(id),
        level INTEGER NOT NULL DEFAULT 1
      );
    `);
    
    // Question responses table
    await db.none(`
      CREATE TABLE question_responses (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        response TEXT NOT NULL,
        shared_with JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Messages table
    await db.none(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Activities table
    await db.none(`
      CREATE TABLE activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        friend_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        content_id INTEGER,
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  }
  
  private async seedInitialData() {
    try {
      console.log('Seeding initial data...');
      // Create default user
      const defaultUser = await this.createUser({
        username: 'alex',
        password: 'password123',
        email: 'alex@example.com',
        fullName: 'Alex Johnson',
        avatarColor: 'bg-gradient-to-r from-primary-400 to-secondary-400',
      });
    
    // Create sample friends
    const sarah = await this.createUser({
      username: 'sarah',
      password: 'password123',
      email: 'sarah@example.com',
      fullName: 'Sarah Thompson',
      avatarColor: 'bg-secondary-100',
    });
    
    const jamie = await this.createUser({
      username: 'jamie',
      password: 'password123',
      email: 'jamie@example.com',
      fullName: 'Jamie Cruz',
      avatarColor: 'bg-accent-100',
    });
    
    const mike = await this.createUser({
      username: 'mike',
      password: 'password123',
      email: 'mike@example.com',
      fullName: 'Mike Rivera',
      avatarColor: 'bg-primary-100',
    });
    
    // Create friend connections
    await Promise.all([
      this.createFriendConnection({
        userId: defaultUser.id,
        friendId: sarah.id,
        status: 'accepted',
        level: 1,
        progress: 70
      }),
      this.createFriendConnection({
        userId: defaultUser.id,
        friendId: jamie.id,
        status: 'accepted',
        level: 1,
        progress: 40
      }),
      this.createFriendConnection({
        userId: defaultUser.id,
        friendId: mike.id,
        status: 'accepted',
        level: 1,
        progress: 80
      })
    ]);
    
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
    
    const categoryEntities = await Promise.all(
      categories.map(category => this.createQuestionCategory(category))
    );
    
    // Create sample questions
    const questions = [
      // Personal History
      {
        text: "What's a childhood memory that still makes you smile?",
        categoryId: categoryEntities[0].id,
        level: 1
      },
      {
        text: "What was your favorite toy or game growing up?",
        categoryId: categoryEntities[0].id,
        level: 1
      },
      {
        text: "Who was your childhood hero and why?",
        categoryId: categoryEntities[0].id,
        level: 1
      },
      
      // Values & Beliefs
      {
        text: "What's one principle you try to live by?",
        categoryId: categoryEntities[1].id,
        level: 1
      },
      {
        text: "What value do you wish more people embraced?",
        categoryId: categoryEntities[1].id,
        level: 1
      },
      {
        text: "What's something you've changed your mind about in the last few years?",
        categoryId: categoryEntities[1].id,
        level: 1
      },
      
      // Hypotheticals
      {
        text: "If you could live in any fictional world, which would you choose and why?",
        categoryId: categoryEntities[2].id,
        level: 1
      },
      {
        text: "If you had to teach a class on any subject, what would it be?",
        categoryId: categoryEntities[2].id,
        level: 1
      },
      {
        text: "If you could have dinner with anyone from history, who would it be?",
        categoryId: categoryEntities[2].id,
        level: 1
      },
      
      // Aspirations & Dreams
      {
        text: "If you could master any skill instantly, what would it be?",
        categoryId: categoryEntities[3].id,
        level: 1
      },
      {
        text: "What's something you want to accomplish in the next year?",
        categoryId: categoryEntities[3].id,
        level: 1
      },
      {
        text: "What's a place you've always wanted to visit?",
        categoryId: categoryEntities[3].id,
        level: 1
      },
      
      // Preferences & Favorites
      {
        text: "What's your favorite way to spend a rainy day?",
        categoryId: categoryEntities[4].id,
        level: 1
      },
      {
        text: "What book, movie, or show do you find yourself recommending most often?",
        categoryId: categoryEntities[4].id,
        level: 1
      },
      {
        text: "What's your comfort food and is there a story behind it?",
        categoryId: categoryEntities[4].id,
        level: 1
      },
      
      // Work & Purpose
      {
        text: "What aspect of your job/studies brings you the most satisfaction?",
        categoryId: categoryEntities[5].id,
        level: 1
      },
      {
        text: "What's a work challenge you're proud of overcoming?",
        categoryId: categoryEntities[5].id,
        level: 1
      },
      {
        text: "What would your ideal workday look like?",
        categoryId: categoryEntities[5].id,
        level: 1
      },
      
      // Current Life
      {
        text: "What are three things you're grateful for today?",
        categoryId: categoryEntities[6].id,
        level: 1
      },
      {
        text: "What's something small that brought you joy recently?",
        categoryId: categoryEntities[6].id,
        level: 1
      },
      {
        text: "What hobby or activity have you been enjoying lately?",
        categoryId: categoryEntities[6].id,
        level: 1
      }
    ];
    
    const questionEntities = await Promise.all(
      questions.map(question => this.createQuestion(question))
    );
    
    // Create sample question responses
    await Promise.all([
      // Sarah's responses
      this.createQuestionResponse({
        questionId: questionEntities[0].id, // Childhood memory question
        userId: sarah.id,
        response: "Building blanket forts with my siblings during rainy days. We'd spend hours creating elaborate 'buildings' with secret rooms and passages.",
        sharedWith: [defaultUser.id, jamie.id] // Shared with default user and Jamie
      }),
      
      this.createQuestionResponse({
        questionId: questionEntities[6].id, // Fictional world question
        userId: sarah.id,
        response: "I'd choose the world of Avatar: The Last Airbender. The idea of bending elements is fascinating, and the show has such rich cultures and philosophies.",
        sharedWith: [defaultUser.id]
      }),
      
      // Jamie's responses
      this.createQuestionResponse({
        questionId: questionEntities[3].id, // Principle to live by
        userId: jamie.id,
        response: "Leave things better than you found them - whether that's a physical space, a project, or a relationship.",
        sharedWith: [defaultUser.id, sarah.id, mike.id]
      }),
      
      this.createQuestionResponse({
        questionId: questionEntities[9].id, // Master any skill
        userId: jamie.id,
        response: "Playing the piano. I've always loved piano music, and it seems like a skill that brings joy to both the player and listeners for a lifetime.",
        sharedWith: [defaultUser.id]
      }),
      
      // Mike's responses
      this.createQuestionResponse({
        questionId: questionEntities[18].id, // Grateful for today
        userId: mike.id,
        response: "1. My morning coffee - it was perfect today. 2. A call with an old friend I hadn't spoken to in months. 3. The sunset I caught while walking home.",
        sharedWith: [defaultUser.id, sarah.id]
      }),
      
      this.createQuestionResponse({
        questionId: questionEntities[12].id, // Rainy day
        userId: mike.id,
        response: "Reading by the window with a cup of tea, listening to the rain. There's something incredibly peaceful about being cozy indoors while it's storming outside.",
        sharedWith: [defaultUser.id, jamie.id]
      })
    ]);
    
    // Create sample messages
    await Promise.all([
      // Conversation with Sarah
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: sarah.id, // Sarah
        content: "Hey Sarah! I saw your answer about blanket forts - that brought back memories!"
      }),
      this.createMessage({
        senderId: sarah.id, // Sarah
        receiverId: defaultUser.id, // Default user
        content: "Haha, glad to hear it! Did you build forts as a kid too?"
      }),
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: sarah.id, // Sarah
        content: "Absolutely! With every blanket and pillow I could find. My parents weren't always thrilled though 😄"
      }),
      this.createMessage({
        senderId: sarah.id, // Sarah
        receiverId: defaultUser.id, // Default user
        content: "Same here! We should plan an adult fort-building day sometime for nostalgia's sake."
      }),
      
      // Conversation with Jamie
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: jamie.id, // Jamie
        content: "I really liked your principle about leaving things better than you found them. Do you have any examples of how you apply that day-to-day?"
      }),
      this.createMessage({
        senderId: jamie.id, // Jamie
        receiverId: defaultUser.id, // Default user
        content: "Thanks! It can be little things like tidying up a meeting room after using it, or bigger things like mentoring someone at work. It helps me stay mindful."
      }),
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: jamie.id, // Jamie
        content: "That's a great perspective. I might adopt that principle too!"
      }),
      
      // Conversation with Mike
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: mike.id, // Mike
        content: "Hey! Let's catch up this weekend. Are you free?"
      }),
      this.createMessage({
        senderId: mike.id, // Mike
        receiverId: defaultUser.id, // Default user
        content: "I'm free on Saturday afternoon! Want to grab coffee?"
      }),
      this.createMessage({
        senderId: defaultUser.id, // Default user
        receiverId: mike.id, // Mike
        content: "Perfect! How about that new place downtown, around 2pm?"
      }),
      this.createMessage({
        senderId: mike.id, // Mike
        receiverId: defaultUser.id, // Default user
        content: "Sounds great! Looking forward to it."
      })
    ]);
    
    // Create sample activities
    await Promise.all([
      this.createActivity({
        userId: defaultUser.id,
        friendId: sarah.id,
        type: 'question_answered',
        contentId: questionEntities[0].id,
        content: "Building blanket forts with my siblings during rainy days..."
      }),
      this.createActivity({
        userId: defaultUser.id,
        friendId: jamie.id,
        type: 'question_asked',
        contentId: questionEntities[9].id,
        content: "If you could master any skill instantly, what would it be?"
      }),
      this.createActivity({
        userId: defaultUser.id,
        friendId: mike.id,
        type: 'message_sent',
        content: "Hey! Let's catch up this weekend. Are you free?"
      }),
      this.createActivity({
        userId: defaultUser.id,
        friendId: jamie.id,
        type: 'question_answered',
        contentId: questionEntities[3].id,
        content: "Leave things better than you found them..."
      }),
      this.createActivity({
        userId: defaultUser.id,
        friendId: mike.id,
        type: 'question_answered',
        contentId: questionEntities[18].id,
        content: "1. My morning coffee - it was perfect today..."
      })
    ]);
    
    console.log('Initial data seeding completed successfully!');
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  }
}

// Export the database storage instance
export const dbStorage = new DBStorage();