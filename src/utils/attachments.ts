import type { Readable } from 'node:stream';
import type Mail from 'nodemailer/lib/mailer';
import type { Url } from 'node:url';
import { readFile } from 'node:fs/promises';
import { Readable as ReadableStream } from 'node:stream';

/**
 * Usesend API attachment format (base64-encoded content)
 */
export interface UsesendAttachment {
    filename: string;
    content: string; // base64-encoded
}

/**
 * Converts a Nodemailer attachment to Usesend API format.
 * Handles all Nodemailer attachment input types and converts content to base64.
 */
export async function processAttachment(
    attachment: Mail.Attachment,
): Promise<UsesendAttachment> {
    // Handle raw MIME content override
    if (attachment.raw) {
        const content = await resolveContent(attachment.raw);
        return {
            filename: generateFilename(attachment),
            content: content.toString('base64'),
        };
    }

    // Priority 1: Handle path (file, URL, or data URI)
    if (attachment.path) {
        const { content, filename } = await processPath(
            attachment.path,
            attachment.filename,
        );
        return {
            filename: filename || generateFilename(attachment),
            content: content.toString('base64'),
        };
    }

    // Priority 2: Handle direct content
    if (attachment.content !== undefined) {
        const content = await processContent(
            attachment.content,
            attachment.encoding,
        );
        return {
            filename: generateFilename(attachment),
            content: content.toString('base64'),
        };
    }

    // No content source provided
    throw new Error(
        `Attachment "${attachment.filename || 'unnamed'}" has no content source (missing content or path)`,
    );
}

/**
 * Processes content based on its type (string, Buffer, Stream)
 */
async function processContent(
    content: string | Buffer | Readable,
    encoding?: string,
): Promise<Buffer> {
    // Handle Buffer
    if (Buffer.isBuffer(content)) {
        return content;
    }

    // Handle Stream
    if (isReadableStream(content)) {
        return await streamToBuffer(content);
    }

    // Handle string
    if (typeof content === 'string') {
        // If encoding is specified, decode the string first
        if (encoding) {
            return Buffer.from(content, encoding as BufferEncoding);
        }
        // Otherwise, treat as UTF-8 string
        return Buffer.from(content, 'utf-8');
    }

    throw new Error(`Unsupported content type: ${typeof content}`);
}

/**
 * Processes path-based attachments (file path, URL, or data URI)
 */
async function processPath(
    path: string | Url,
    filename?: string | false,
): Promise<{ content: Buffer; filename?: string }> {
    // Convert to string (handles both string and Url types)
    const pathStr = typeof path === 'string' ? path : path.href;

    // Handle data URI (e.g., data:image/png;base64,...)
    if (pathStr.startsWith('data:')) {
        return processDataURI(pathStr, filename);
    }

    // Handle HTTP/HTTPS URLs
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
        return await fetchFromURL(pathStr, filename);
    }

    // Handle file paths (remove file:// prefix if present)
    const filePath = pathStr.startsWith('file://')
        ? pathStr.slice(7)
        : pathStr;
    return await readFromFile(filePath, filename);
}

/**
 * Parses and extracts content from data URI
 */
function processDataURI(
    dataUri: string,
    filename?: string | false,
): { content: Buffer; filename?: string } {
    const match = dataUri.match(/^data:([^;]+)?(?:;base64)?,(.*)$/);
    if (!match) {
        throw new Error('Invalid data URI format');
    }

    const [, mimeType, data] = match;
    const isBase64 = dataUri.includes(';base64,');

    // Extract content
    const content = isBase64
        ? Buffer.from(data, 'base64')
        : Buffer.from(decodeURIComponent(data), 'utf-8');

    // Generate filename from MIME type if needed
    let generatedFilename: string | undefined;
    if (!filename && mimeType) {
        const ext = mimeType.split('/')[1] || 'bin';
        generatedFilename = `attachment.${ext}`;
    }

    return { content, filename: generatedFilename };
}

/**
 * Fetches content from HTTP/HTTPS URL
 */
async function fetchFromURL(
    url: string,
    filename?: string | false,
): Promise<{ content: Buffer; filename?: string }> {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const content = Buffer.from(arrayBuffer);

        // Try to extract filename from URL if not provided
        let generatedFilename: string | undefined;
        if (!filename) {
            const urlPath = new URL(url).pathname;
            const urlFilename = urlPath.split('/').pop();
            if (urlFilename && urlFilename.length > 0) {
                generatedFilename = urlFilename;
            }
        }

        return { content, filename: generatedFilename };
    } catch (error) {
        throw new Error(
            `Failed to fetch attachment from URL "${url}": ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Reads content from file system
 */
async function readFromFile(
    filePath: string,
    filename?: string | false,
): Promise<{ content: Buffer; filename?: string }> {
    try {
        const content = await readFile(filePath);

        // Extract filename from path if not provided
        let generatedFilename: string | undefined;
        if (!filename) {
            const pathSegments = filePath.split('/');
            const fileFilename = pathSegments[pathSegments.length - 1];
            if (fileFilename && fileFilename.length > 0) {
                generatedFilename = fileFilename;
            }
        }

        return { content, filename: generatedFilename };
    } catch (error) {
        throw new Error(
            `Failed to read attachment from file "${filePath}": ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

/**
 * Converts a Readable stream to Buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        stream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        stream.on('error', (error) => {
            reject(
                new Error(
                    `Failed to read stream: ${error instanceof Error ? error.message : String(error)}`,
                ),
            );
        });
    });
}

/**
 * Resolves content from raw MIME content (string, Buffer, Stream, or object)
 */
async function resolveContent(
    raw: string | Buffer | Readable | Mail.AttachmentLike,
): Promise<Buffer> {
    if (Buffer.isBuffer(raw)) {
        return raw;
    }

    if (typeof raw === 'string') {
        return Buffer.from(raw, 'utf-8');
    }

    if (isReadableStream(raw)) {
        return await streamToBuffer(raw);
    }

    // If it's an AttachmentLike object, recursively process it
    if (typeof raw === 'object' && raw !== null) {
        const attachmentLike = raw as Mail.AttachmentLike;
        if (attachmentLike.path) {
            // Convert path to string (handles both string and Url types)
            const pathStr = typeof attachmentLike.path === 'string'
                ? attachmentLike.path
                : attachmentLike.path.href;
            const { content } = await processPath(pathStr);
            return content;
        }
        if (attachmentLike.content !== undefined) {
            return await processContent(attachmentLike.content);
        }
    }

    throw new Error('Unsupported raw content type');
}

/**
 * Generates a filename when none is provided
 */
function generateFilename(attachment: Mail.Attachment): string {
    if (attachment.filename && typeof attachment.filename === 'string') {
        return attachment.filename;
    }

    // Try to extract from content type
    if (attachment.contentType) {
        const ext = attachment.contentType.split('/')[1] || 'bin';
        return `attachment.${ext}`;
    }

    // Default fallback
    return 'attachment.bin';
}

/**
 * Type guard to check if value is a Readable stream
 */
function isReadableStream(value: unknown): value is Readable {
    return (
        value !== null &&
        typeof value === 'object' &&
        typeof (value as ReadableStream).pipe === 'function' &&
        typeof (value as ReadableStream).on === 'function'
    );
}
