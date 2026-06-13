import type { Game } from '../../src/interfaces/models.js';
import { journalSchema } from '../../src/services/journalValidation.js';
import { journalRepository, type JournalDocument, type JournalRepository } from '../repositories/journalRepository.js';

export class JournalValidationError extends Error {
  constructor(public readonly details: unknown) {
    super('Journal data is invalid.');
    this.name = 'JournalValidationError';
  }
}

export class JournalService {
  private initialization?: Promise<void>;

  constructor(private readonly repository: JournalRepository) {}

  initialize() {
    this.initialization ??= this.repository.initialize();
    return this.initialization;
  }

  async getForUser(userId: string): Promise<JournalDocument> {
    await this.initialize();
    return this.repository.findByUserId(userId);
  }

  async replaceForUser(userId: string, value: unknown): Promise<void> {
    const parsed = journalSchema.safeParse(value);
    if (!parsed.success) throw new JournalValidationError(parsed.error.flatten());

    await this.initialize();
    await this.repository.saveByUserId(userId, parsed.data as Game[]);
  }
}

export const journalService = journalRepository
  ? new JournalService(journalRepository)
  : undefined;
