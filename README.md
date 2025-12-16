# Gaia Health MCP Server

This is an MCP server for Gaia Health, exposing Supabase functionality to n8n.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your Supabase credentials.
    ```bash
    cp .env.example .env
    ```
    Edit `.env`:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    PORT=3000
    ```

## Running the Server

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

## Testing

1.  Start the server in one terminal: `npm run dev`
2.  Run the test client in another terminal:
    ```bash
    npx ts-node test-client.ts
    ```

## n8n Integration

1.  Open n8n.
2.  Add an **MCP Client** node.
3.  Set the **Server URL** to `http://localhost:3000/sse` (or your deployed URL).
4.  The tools (`schedule_appointment`, `list_appointments`, etc.) should now be available.
