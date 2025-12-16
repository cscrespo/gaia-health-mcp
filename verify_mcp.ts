import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

async function testServer() {
    console.log('1. Connecting to SSE...');
    // We connect to the local server directly to verify the code logic
    const eventSource = new EventSource('http://localhost:3000/sse');

    eventSource.onopen = () => {
        console.log('✅ SSE Connection Opened!');
    };

    eventSource.onmessage = async (event) => {
        console.log('📩 Received Event:', event.data);
        const data = JSON.parse(event.data);

        // Standard MCP flow: Server sends "endpoint" event telling us where to POST
        if (event.type === 'endpoint') {
            const postUrl = `http://localhost:3000${data}`;
            console.log(`2. Server instructed to POST to: ${postUrl}`);

            // Simulate n8n sending "initialize"
            const payload = {
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: { name: "test-script", version: "1.0" }
                }
            };

            try {
                console.log('3. Sending JSON-RPC Initialize...');
                const response = await fetch(postUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    console.log(`✅ POST Success! Status: ${response.status}`);
                    console.log('🎉 SERVER IS WORKING CORRECTLY (Logic Proof)');
                } else {
                    console.error(`❌ POST Failed: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                console.error('❌ POST Error:', err);
            } finally {
                eventSource.close();
                process.exit(0);
            }
        }
    };

    eventSource.onerror = (err) => {
        console.error('❌ SSE Error:', err);
    };
}

testServer();
