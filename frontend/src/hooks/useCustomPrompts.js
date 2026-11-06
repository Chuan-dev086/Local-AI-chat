// src/hooks/useCustomPrompts.js
import { useState, useEffect } from "react";

const CUSTOM_PROMPTS_STORAGE_KEY = "local_ai_chat_custom_prompts";

/**
 * Custom hook to manage user-defined prompt templates with localStorage persistence and strict deduplication.
 * Time Complexity: O(n) for checking duplicates against existing templates where n is the number of templates.
 * Space Complexity: O(n) to store the template array in React state.
 * Edge Cases: Handles corrupted localStorage, empty inputs, and duplicate names/contents.
 */
export function useCustomPrompts() {
  const [prompts, setPrompts] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PROMPTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to parse custom prompts from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
    } catch (error) {
      console.error("Failed to save custom prompts to localStorage:", error);
    }
  }, [prompts]);

  const addPrompt = (name, promptContent) => {
    const trimmedName = name?.trim();
    const trimmedContent = promptContent?.trim();
    if (!trimmedName || !trimmedContent)
      return { success: false, reason: "empty" };

    // 严格去重校验：检查名称或内容是否已存在
    const isDuplicate = prompts.some(
      (item) => item.name === trimmedName || item.prompt === trimmedContent,
    );

    if (isDuplicate) {
      return { success: false, reason: "duplicate" };
    }

    const newTemplate = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      prompt: trimmedContent,
    };

    setPrompts((prev) => [...prev, newTemplate]);
    return { success: true };
  };

  const updatePrompt = (id, name, promptContent) => {
    if (!id || !name?.trim() || !promptContent?.trim()) return;
    setPrompts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, name: name.trim(), prompt: promptContent.trim() }
          : item,
      ),
    );
  };

  const deletePrompt = (id) => {
    setPrompts((prev) => prev.filter((item) => item.id !== id));
  };

  return { prompts, addPrompt, updatePrompt, deletePrompt };
}
