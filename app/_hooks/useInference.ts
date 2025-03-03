import { useContext } from "react";
import { InferenceContext } from "../_providers/InferenceProvider";

export const useInference = () => {
  const context = useContext(InferenceContext);
  if (!context) {
    throw new Error('useInference must be used within an InferenceProvider');
  }
  return context;
};
