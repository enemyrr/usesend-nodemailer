# Usesend Nodemailer

> A Nodemailer transport package that enables sending emails through the Usesend API with enhanced error handling and validation.

## Features

- ✅ Full Nodemailer Transport interface support
- ✅ Automatic email validation with detailed error messages
- ✅ Display name support (`"Name <email@example.com>"`)
- ✅ Automatic text/HTML content handling
- ✅ Custom API endpoint support
- ✅ Enhanced error reporting with helpful hints
- ✅ TypeScript support with full type definitions

## Installation

### npm
```bash
npm install usesend-nodemailer
```

### pnpm
```bash
pnpm add usesend-nodemailer
```

### bun
```bash
bun add usesend-nodemailer
```

## Quick Start

```typescript
import { UsesendTransport } from 'usesend-nodemailer';
import { createTransport } from 'nodemailer';

// Create transport
const mailer = createTransport(
  UsesendTransport.makeTransport({
    apiKey: 'your_usesend_api_key'
  })
);

// Send email
await mailer.sendMail({
  from: 'sender@yourdomain.com',
  to: 'recipient@example.com',
  subject: 'Hello from Usesend!',
  html: '<h1>Welcome!</h1><p>This is a test email.</p>',
});
```

## Configuration

### Basic Configuration

```typescript
const mailer = createTransport(
  UsesendTransport.makeTransport({
    apiKey: 'your_usesend_api_key'
  })
);
```

### Custom API Endpoint

If you need to use a custom Usesend API endpoint (e.g., self-hosted instance):

```typescript
const mailer = createTransport(
  UsesendTransport.makeTransport({
    apiKey: 'your_usesend_api_key',
    apiUrl: 'https://your-custom-endpoint.com'
  })
);
```

### Environment Variables

You can also use environment variables:

```bash
USESEND_API_KEY=your_api_key
USESEND_URL=https://your-custom-endpoint.com  # Optional
```

## Usage Examples

### Basic Email

```typescript
await mailer.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our service!</h1>',
});
```

### Email with Display Names

The transport supports display names in email addresses:

```typescript
await mailer.sendMail({
  from: 'Your Company <noreply@yourdomain.com>',
  to: 'John Doe <john@example.com>',
  subject: 'Personalized Email',
  html: '<p>Hello John!</p>',
});
```

### Email with Multiple Recipients

```typescript
await mailer.sendMail({
  from: 'noreply@yourdomain.com',
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@example.com',
  bcc: ['admin@yourdomain.com'],
  subject: 'Team Update',
  html: '<p>Important team announcement</p>',
});
```

### Email with Plain Text and HTML

```typescript
await mailer.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Multi-format Email',
  text: 'This is the plain text version.',
  html: '<h1>This is the HTML version</h1>',
});
```

**Note:** If you only provide HTML, the transport automatically generates a plain text version by stripping HTML tags. If you only provide text, it's used for both formats.

### Email with Attachments

```typescript
await mailer.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Document Attached',
  html: '<p>Please find the document attached.</p>',
  attachments: [
    {
      filename: 'document.pdf',
      content: Buffer.from('...'), // or base64 string
    }
  ],
});
```

## Validation Features

The transport includes comprehensive validation:

### Email Address Validation
- Validates all email addresses (from, to, cc, bcc, replyTo)
- Supports display name format: `"Name <email@example.com>"`
- Provides clear error messages for invalid email formats

```typescript
// ✅ Valid formats
"user@example.com"
"John Doe <john@example.com>"
["user1@example.com", "user2@example.com"]

// ❌ Invalid - will throw error
"invalid-email"
"user@"
"@example.com"
```

### Required Fields Validation
- Validates that `from`, `to`, and `subject` are provided
- Ensures at least one content type (text or html) is present

### Content Handling
- Automatically generates text version from HTML if only HTML is provided
- Uses text content for both formats if only text is provided
- Supports both text and HTML when both are provided

## Error Handling

The transport provides detailed error messages with helpful hints:

### Validation Errors
```
Invalid email address in "to": "invalid-email".
Please provide a valid email address (e.g., user@example.com or "Name <user@example.com>").
```

### API Errors
- **400 Bad Request**: Hints about invalid formats, missing fields, or malformed data
- **401 Unauthorized**: Authentication failed, check your API key
- **403 Forbidden**: API key lacks permissions
- **429 Rate Limited**: Too many requests, wait before retrying
- **5xx Server Error**: Usesend service issues

### Domain Verification Errors
```
Usesend API Error (BAD_REQUEST): Domain: example.com of from email is wrong.
Use the domain verified by useSend
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { UsesendTransport, UsesendTransporterOptions } from 'usesend-nodemailer';

const options: UsesendTransporterOptions = {
  apiKey: 'your_api_key',
  apiUrl: 'https://custom-endpoint.com', // optional
};

const transport = UsesendTransport.makeTransport(options);
```

## API Reference

### `UsesendTransport.makeTransport(options)`

Creates a new Usesend transport instance.

**Parameters:**
- `options.apiKey` (string, required): Your Usesend API key
- `options.apiUrl` (string, optional): Custom API endpoint URL

**Returns:** Transport instance compatible with Nodemailer

### `transport.send(mail, callback)`

Sends an email (called automatically by Nodemailer's `sendMail` method).

**Parameters:**
- `mail`: MailMessage object from Nodemailer
- `callback`: Callback function with error and response info

## Requirements

- Node.js 14.0 or higher
- Nodemailer ^6.10.0 (peer dependency)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- GitHub Issues: [https://github.com/enemyrr/usesend-nodemailer/issues](https://github.com/enemyrr/usesend-nodemailer/issues)
- Usesend Documentation: [https://docs.usesend.com](https://docs.usesend.com)
