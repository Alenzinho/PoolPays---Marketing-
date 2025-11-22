
import { VectorDocument, KnowledgeCategory } from "../types";
import { getEmbedding } from "./gemini";
import { INITIAL_KNOWLEDGE } from "../data";

const STORAGE_KEY = 'poolpays-vector-store';

class VectorStore {
  private documents: VectorDocument[] = [];
  private initialized = false;

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.documents = JSON.parse(saved);
      this.initialized = true;
    } else {
      // Initialize with Core Memory if empty
      this.initializeMemory();
    }
  }

  private async initializeMemory() {
    if (this.initialized) return;
    console.log("Initializing Core Memory...");
    for (const doc of INITIAL_KNOWLEDGE) {
      await this.upsertDocument(doc);
    }
    this.initialized = true;
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
  }

  async upsertDocument(doc: Omit<VectorDocument, 'embedding'>) {
    this.documents = this.documents.filter(d => d.id !== doc.id);
    
    // Generate embedding if missing (it usually is for new docs)
    const embedding = await getEmbedding(doc.content);

    const newDoc: VectorDocument = { ...doc, embedding };
    this.documents.push(newDoc);
    this.save();
  }

  removeDocument(id: string) {
    this.documents = this.documents.filter(d => d.id !== id);
    this.save();
  }

  /**
   * Searches the vector store for similar documents.
   * @param query The user's search query
   * @param limit Max number of results
   * @param allowedCategories (Optional) List of Neural Folders to restrict search to
   */
  async search(query: string, limit: number = 5, allowedCategories?: string[]): Promise<VectorDocument[]> {
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding.length) return [];

    // 1. Filter by Category (Neural Folder Scope)
    // If allowedCategories is provided, we only look at documents in those folders.
    let candidateDocs = this.documents;
    
    if (allowedCategories && allowedCategories.length > 0) {
        candidateDocs = this.documents.filter(doc => {
            const docCat = doc.metadata.category || 'GENERAL';
            return allowedCategories.includes(docCat);
        });
    }

    // 2. Calculate Cosine Similarity
    const scoredDocs = candidateDocs.map(doc => {
      if (!doc.embedding) return { doc, score: -1 };
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { doc, score };
    });

    // 3. Sort and Slice
    scoredDocs.sort((a, b) => b.score - a.score);

    return scoredDocs
      .filter(item => item.score > 0.35) 
      .slice(0, limit)
      .map(item => item.doc);
  }

  // Helper to filter by category for the UI
  getDocumentsByType(type: string | 'ALL'): VectorDocument[] {
    if (type === 'ALL') return this.documents;
    // Basic filter mapping or direct property check
    return this.documents.filter(d => d.type === type || d.metadata.category === type);
  }

  getStats() {
    return {
      totalDocs: this.documents.length,
      core: this.documents.filter(d => d.metadata.category === 'CORE_IDENTITY').length,
      tech: this.documents.filter(d => d.metadata.category === 'TECH_DOCS').length,
      marketing: this.documents.filter(d => d.metadata.category === 'MARKETING_OPS').length
    };
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return (normA === 0 || normB === 0) ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStore = new VectorStore();
