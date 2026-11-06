// backend/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true, index: true }, // 关联字段，建立索引以提升查询性能
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    file: { type: String },
    fileContent: { type: String },
    imageBase64: { type: String },
    mimeType: { type: String },
    createdAt: { type: String },
  },
  {
    timestamps: true,
  },
);

export const Message = mongoose.model("Message", messageSchema);
