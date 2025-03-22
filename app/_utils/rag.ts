// app/_utils/rag.ts

import { env, pipeline } from '@huggingface/transformers';
;

// Configure environment for transformers.js
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.remoteHost = '/api/models';
env.remotePathTemplate = '{model}';

// Models to use for the RAG pipeline
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const GENERATION_MODEL = 'Xenova/Llama-2-7b-chat-hf';  // Using a lighter model that works well with transformers.js

// Class to handle the complete RAG pipeline
export class RAGPipeline {
  private embeddingPipeline: any = null;
  private generationPipeline: any = null;
  private embeddingProgress: number = 0;
  private generationProgress: number = 0;
  private isInitialized: boolean = false;

  constructor() {}

  /**
   * Initialize both embedding and generation models
   */
  async initialize() {
    try {
      console.log('Initializing RAG pipeline...');
      
      // Initialize embedding model
      this.embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
        quantized: false, // Keep full precision for embeddings
        progress_callback: (progress: any) => {
          if (!isNaN(progress.progress)) {
            this.embeddingProgress = progress.progress;
            console.log(`Embedding model loading: ${Math.round(this.embeddingProgress * 100)}%`);
          }
        }
      });
      
      // Initialize generation model
      this.generationPipeline = await pipeline('text-generation', GENERATION_MODEL, {
        quantized: true, // Use quantization for the generation model to reduce size
        progress_callback: (progress: any) => {
          if (!isNaN(progress.progress)) {
            this.generationProgress = progress.progress;
            console.log(`Generation model loading: ${Math.round(this.generationProgress * 100)}%`);
          }
        }
      });
      
      this.isInitialized = true;
      console.log('RAG pipeline initialized successfully!');
      return true;
    } catch (error) {
      console.error('Failed to initialize RAG pipeline:', error);
      return false;
    }
  }

  /**
   * Generate embeddings for a text input
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized || !this.embeddingPipeline) {
      throw new Error('Embedding model not initialized');
    }

    try {
      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Convert to regular array for easier storage
      return Array.from(result.data);
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  /**
   * Find the most relevant notes for a query
   */
  async findRelevantNotes(queryText: string, notes: EmbeddingRecord[], topK: number = 3): Promise<EmbeddingRecord[]> {
    if (!this.isInitialized) {
      throw new Error('RAG pipeline not initialized');
    }
    
    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    // Calculate similarity scores
    const scoredNotes = notes.map(note => ({
      ...note,
      score: this.cosineSimilarity(queryEmbedding, note.vector as number[])
    }));
    
    // Sort by similarity score (descending)
    scoredNotes.sort((a, b) => b.score - a.score);
    
    // Return top K results
    return scoredNotes.slice(0, topK);
  }

  /**
   * Construct prompt with retrieved context for the generation model
   */
  constructPrompt(question: string, relevantNotes: EmbeddingRecord[]): string {
    // Format the context from relevant notes
    const context = relevantNotes
      .map((note, index) => {
        return `[${index + 1}] ${note.path}: ${note.content.trim()}`;
      })
      .join('\n\n');
    
    // Construct a prompt that works well with LLaMA models
    return `<s>[INST] <<SYS>>
You are a helpful assistant that answers questions based only on the provided context.
If you don't know the answer based on the context, just say "I don't have enough information to answer this question."
Always cite your sources using the numbers in square brackets.
<</SYS>>

I need help with the following question:
${question}

Here is the context to use in formulating your answer:
${context}
[/INST]`;
  }

  /**
   * Generate answer based on retrieved context
   */
  async generateAnswer(question: string, relevantNotes: EmbeddingRecord[]): Promise<{answer: string, sources: FileNode[]}> {
    if (!this.isInitialized || !this.generationPipeline) {
      throw new Error('Generation model not initialized');
    }
    
    const prompt = this.constructPrompt(question, relevantNotes);
    
    try {
      // Generate response
      const result = await this.generationPipeline(prompt, {
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.2,
        do_sample: true
      });
      
      const fullResponse = result[0].generated_text;
      
      // Extract the model's response after the prompt
      const answer = fullResponse.substring(prompt.length).trim();
      
      // Prepare source information
      const sources = relevantNotes.map(note => ({
        name: note.name,
        path: note.path,
        extension: note.path.split('.').pop()
      }));
      
      return { answer, sources };
    } catch (error) {
      console.error('Error generating answer:', error);
      return { 
        answer: "I'm sorry, I encountered an error while generating a response. Please try again.", 
        sources: [] 
      };
    }
  }

  /**
   * Complete RAG process: from question to answer
   */
  async processQuestion(question: string, allNotes: EmbeddingRecord[]): Promise<{answer: string, sources: FileNode[]}> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // 1. Find relevant notes
      const relevantNotes = await this.findRelevantNotes(question, allNotes);
      
      // 2. Generate answer using the relevant notes
      const result = await this.generateAnswer(question, relevantNotes);
      
      return result;
    } catch (error) {
      console.error('Error processing question:', error);
      return { 
        answer: "I'm sorry, I encountered an error while processing your question. Please try again.", 
        sources: [] 
      };
    }
  }

  /**
   * Get current initialization progress
   */
  getProgress(): number {
    return (this.embeddingProgress + this.generationProgress) / 2;
  }

  /**
   * Check if both models are fully loaded
   */
  isReady(): boolean {
    return this.isInitialized && this.embeddingProgress === 1 && this.generationProgress === 1;
  }
}

// Create a singleton instance
const ragPipeline = new RAGPipeline();

export default ragPipeline;