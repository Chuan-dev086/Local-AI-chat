// backend/db.js
import mongoose from "mongoose";
import "dotenv/config";

// MongoDB connection URI from environment or default to local instance
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/local_ai_chat";

/**
 * Establish connection to MongoDB using Mongoose.
 * Time Complexity: O(1) connection setup.
 * Space Complexity: O(1).
 * Edge Cases: Handles connection errors and terminates process on failure.
 */
export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 7+ defaults are optimized, but explicit options can be added if needed
    });
    console.log(
      `[Database] Connected to MongoDB successfully at ${MONGODB_URI}`,
    );
  } catch (error) {
    console.error("[Database] Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}
