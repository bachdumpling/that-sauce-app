import {
  EmbeddingRepository,
  EmbeddingResponse,
} from "../repositories/EmbeddingRepository";

export type SearchType = "creators" | "projects" | "images" | "media";

export class EmbeddingService {
  private embeddingRepo: EmbeddingRepository;

  constructor() {
    this.embeddingRepo = new EmbeddingRepository();
  }

  /**
   * Generate embedding for search query
   */
  async generateEmbedding(
    text: string,
    type: SearchType = "creators"
  ): Promise<EmbeddingResponse | null> {
    return this.embeddingRepo.generateEmbedding(text, type);
  }
}

// For backward compatibility with existing code
export async function generateEmbedding(
  text: string,
  type: SearchType = "creators"
): Promise<EmbeddingResponse | null> {
  const service = new EmbeddingService();
  return service.generateEmbedding(text, type);
}
