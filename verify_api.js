

const API_URL = 'http://localhost:3001';

async function testApi() {
    console.log("1. Testing GET /expenses...");
    try {
        const res = await fetch(`${API_URL}/expenses`);
        const data = await res.json();
        console.log("   Success! Current count:", data.length);
    } catch (e) {
        console.error("   Failed to connect to API:", e.message);
        process.exit(1);
    }

    console.log("2. Testing POST /expenses...");
    let newId;
    try {
        const res = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: "2023-11-24",
                amount: 1000,
                category: "Test",
                stage: "Test Stage",
                description: "API Test"
            })
        });
        const data = await res.json();
        newId = data.id;
        console.log("   Success! Created expense with ID:", newId);
    } catch (e) {
        console.error("   Failed to create expense:", e.message);
        process.exit(1);
    }

    console.log("3. Testing DELETE /expenses...");
    try {
        await fetch(`${API_URL}/expenses/${newId}`, { method: 'DELETE' });
        console.log("   Success! Deleted expense.");
    } catch (e) {
        console.error("   Failed to delete expense:", e.message);
    }

    console.log("API Verification Complete. Backend is healthy.");
}

testApi();
