import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Singleton service for managing presentation data.
 * Since there's only ever one presentation at a time, this provides
 * a single source of truth for the active presentation.
 */
class PresentationService {
  private static instance: PresentationService;
  private presentation: CollectionEntry<'presentations'> | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  static getInstance(): PresentationService {
    if (!PresentationService.instance) {
      PresentationService.instance = new PresentationService();
    }
    return PresentationService.instance;
  }

  /**
   * Get the active presentation (cached after first fetch)
   * Since there's only one presentation at a time, we always return the first one
   */
  async getPresentation(): Promise<CollectionEntry<'presentations'>> {
    if (this.presentation === null) {
      const presentations = await getCollection('presentations');
      if (presentations.length === 0) {
        throw new Error('No presentations found');
      }
      // Always use the first presentation
      this.presentation = presentations[0];
    }
    return this.presentation;
  }

  /**
   * Invalidate the cache (useful for hot reload scenarios)
   */
  invalidateCache(): void {
    this.presentation = null;
  }
}

// Export singleton instance
export const presentationService = PresentationService.getInstance();
export default presentationService;
