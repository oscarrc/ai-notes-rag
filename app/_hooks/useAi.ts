import { AiContext } from "../_providers/AiProvider";
import { useContext } from "react";

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};
