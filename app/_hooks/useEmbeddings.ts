import { useContext } from "react";
import { EmbeddingsContext } from "../_providers/EmbeddingsProvider";

export const useEmbeddings = () => {
  const context = useContext(EmbeddingsContext);
  if (!context) {
    throw new Error('useEmbeddings must be used within an EmbeddingsProvider');
  }
  return context;
};
