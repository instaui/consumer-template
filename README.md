# Item CRUD Application

A React-based CRUD (Create, Read, Update, Delete) application with dynamic form generation, file uploads, and advanced filtering capabilities.

## Features

- Dynamic form generation based on configuration
- File and image upload support
- Advanced filtering and sorting
- Pagination
- Relation field support
- Responsive design with drawer/modal views
- Type-safe implementation

## Project Structure

```
src/
├── components/
│   └── ItemCrud.tsx      # Main CRUD component
├── constants/
│   └── UI_CONSTANTS.ts   # UI-related constants
└── App.tsx               # Application entry point
```

## Configuration

The application is configured through endpoint definitions in `App.tsx`. Each endpoint can define:

```typescript
{
  key: string;           // Unique identifier
  label: string;         // Display name
  url: string;          // API endpoint
  idField?: string;     // Primary key field
  fields: FieldConfig[]; // Field configurations
  validator?: Function;  // Custom validation
}
```

### Field Types

Supported field types:

- text
- textarea
- number
- email
- select
- date
- boolean
- url
- relation
- file
- image

### Field Configuration

```typescript
{
  key: string;           // Field identifier
  label: string;         // Display label
  type: string;          // Field type
  required?: boolean;    // Required field
  readOnly?: boolean;    // Read-only field
  isFile?: boolean;      // File upload field
  isImage?: boolean;     // Image upload field
  uploadUrl?: string;    // Custom upload URL
  maxSize?: number;      // Max file size in MB
  options?: Array<{      // For select fields
    label: string;
    value: string;
  }>;
  relation?: {           // For relation fields
    entity: string;
    idField: string;
    keyColumns?: string[];
  };
}
```

## File Uploads

The application supports two types of file uploads:

1. **Direct Form Upload**

   - Files are included in the main form submission
   - Used when `uploadUrl` is not specified
   - Files are sent as part of the multipart/form-data

2. **Separate Upload**
   - Files are uploaded to a separate endpoint first
   - Used when `uploadUrl` is specified
   - The response URL/ID is then included in the main form

## Filtering and Sorting

- Supports multiple filter types:
  - Text search
  - Range filters
  - Boolean filters
  - Select filters
- Sortable columns
- URL-based filter persistence

## Usage

1. Define your endpoints in `App.tsx`
2. Configure fields for each endpoint
3. The application will automatically generate:
   - List view with filters
   - Create/Edit forms
   - Detail view
   - File upload handling

## API Integration

The application expects the API to follow these conventions:

```typescript
interface APIResponse {
  status: string;
  message: string;
  data: Item | Item[];
  count?: number; // For pagination
}
```

## Error Handling

- Form validation errors
- API error handling
- File upload error handling
- Network error handling

## Styling

- Uses Ant Design components
- Responsive layout
- Customizable through constants
- Supports both modal and drawer views

## Type Safety

- Full TypeScript implementation
- Type-safe field configurations
- Type-safe API responses
- Type-safe form handling

## Development

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Start development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Dependencies

- React
- React Router
- Ant Design
- TypeScript
- Axios (or compatible API client)
