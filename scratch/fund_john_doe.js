// Using native fetch (Node.js 18+)

const BASE_URL = 'http://localhost:5001/api';

async function fundAccount(number, amount) {
    try {
        const res = await fetch(`${BASE_URL}/accounts/by-number/${number}/balance`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta: amount })
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`✅ Updated ${data.name}: New Balance $${data.balance}`);
        } else {
            console.error(`❌ Error: ${data.error}`);
        }
    } catch (err) {
        console.error(`❌ Failed to connect: ${err.message}`);
    }
}

async function run() {
    console.log('Funding John Doe\'s accounts...');
    // You can adjust these amounts as needed
    await fundAccount('9876543210', 10000); // Add $10,000 to Personal Savings
    await fundAccount('1234567890', 10000); // Add $10,000 to Main Checking
}

run();
