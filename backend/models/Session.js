// backend/models/Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, default: "New Chat" },
    mode: { type: String, enum: ["chat", "code"], default: "chat" },
    model: { type: String, required: true },
    systemPrompt: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

export const Session = mongoose.model("Session", sessionSchema);
