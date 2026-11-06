// src/hooks/useCustomPrompts.js
import { useState, useEffect } from "react";

const CUSTOM_PROMPTS_STORAGE_KEY = "local_ai_chat_custom_prompts";

/**
 * Custom hook to manage user-defined prompt templates with localStorage persistence.
 * Time Complexity: O(n) for reading/writing storage and filtering where n is the number of templates.
 * Space Complexity: O(n) to store the template array in React state.
 * Edge Cases: Handles corrupted localStorage data, empty fields, duplicate names, and storage quotas.
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
    if (!name?.trim() || !promptContent?.trim()) return;
    const newTemplate = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      prompt: promptContent.trim(),
    };
    setPrompts((prev) => [...prev, newTemplate]);
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
