// Fix duplicate account number and restore John Doe's incorrectly deducted balance

const BASE_URL = 'http://localhost:5001/api';

async function patch(id, body) {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (res.ok) console.log(`✅ ${data.name}: ${JSON.stringify(body)}`);
    else console.error(`❌ Error on ${id}: ${data.error}`);
}

async function run() {
    console.log('1. Fixing Test User Platinum Credit Card duplicate number...');
    // Give it a proper unique number
    await patch('acc-5', { number: '5678901234' });

    console.log('2. Restoring John Doe Personal Savings $10 (incorrectly deducted)...');
    // Add back the $10 that was wrongly deducted
    const res = await fetch(`${BASE_URL}/accounts/by-number/9876543210/balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 10 })
    });
    const data = await res.json();
    if (res.ok) console.log(`✅ Personal Savings restored: $${data.balance}`);
    else console.error(`❌ Error restoring balance: ${data.error}`);

    console.log('\nDone! Updated account numbers:');
    console.log('  Test User - Platinum Credit Card: 5678901234');
    console.log('  John Doe  - Main Checking: 1234567890 (unchanged, now unique)');
}

run();
