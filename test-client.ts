import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
    const transport = new SSEClientTransport(
        new URL("http://localhost:3000/sse")
    );
    const client = new Client(
        {
            name: "example-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    console.log("Connecting to server...");
    await client.connect(transport);
    console.log("Connected!");

    console.log("Listing tools...");
    const tools = await client.listTools();
    console.log("Tools:", JSON.stringify(tools, null, 2));

    // Example: List appointments (will likely fail or return empty if DB not connected/empty)
    // console.log("Calling list_appointments...");
    // const result = await client.callTool({
    //   name: "list_appointments",
    //   arguments: {},
    // });
    // console.log("Result:", result);
}

main().catch(console.error);
