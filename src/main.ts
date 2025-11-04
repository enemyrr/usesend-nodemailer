import { UsesendTransport } from './transport';
import { UsesendTransporterOptions } from './types/transport';

// Export main transport and types
export { UsesendTransport };
export type { UsesendTransporterOptions };

// Export attachment utilities (useful for testing and advanced usage)
export { processAttachment, type UsesendAttachment } from './utils/attachments';
