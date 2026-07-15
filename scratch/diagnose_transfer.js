// Diagnostic: check what the API finds for John Doe's account numbers
// and verify the transfer would work correctly

// const BASE_URL = 'http://localhost:5001/api';
 const BASE_URL = 'http://192.168.22.89:5001/api';

async function checkAccounts() {
    // Check all accounts
    const res = await fetch(`${BASE_URL}/accounts`);
    const all = await res.json();
    console.log('\n=== ALL ACCOUNTS IN DB ===');
    all.forEach(a => {
        console.log(`[${a.userId}] ${a.name} | number: ${a.number} | balance: $${a.balance}`);
    });

    // Check for duplicate account numbers
    const nums = all.map(a => a.number);
    const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
    if (dupes.length > 0) {
        console.log('\n⚠️  DUPLICATE ACCOUNT NUMBERS FOUND:', dupes);
    } else {
        console.log('\n✅ No duplicate account numbers');
    }

    // Simulate what updateAccountBalanceByNumber does for each of John Doe's numbers
    console.log('\n=== LOOKUP TEST ===');
    for (const num of ['9876543210', '1234567890']) {
        const found = all.find(a => a.number === num);
        console.log(`findOne({ number: '${num}' }) → ${found ? `${found.name} (${found.userId})` : 'NOT FOUND'}`);
    }
}

checkAccounts();
