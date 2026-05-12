// Add a 4th FD and clean up FD count to exactly 4

const BASE_URL = 'http://localhost:5001/api';

async function run() {
    // Check current FDs
    const res = await fetch(`${BASE_URL}/fixed-deposits`);
    const fds = await res.json();
    console.log(`Current FDs: ${fds.length}`);
    fds.forEach(f => console.log(`  [${f.id}] ${f.tenure} - ₹${f.principal.toLocaleString()}`));

    // Add a 4th FD if there are only 3
    if (fds.length === 3) {
        console.log('\nAdding 4th FD...');
        const newFD = {
            id: "fd-4",
            principal: 75000,
            rate: 6.8,
            tenure: "2 Years",
            startDate: "2025-01-10",
            maturityDate: "2027-01-10",
            maturityAmount: 87855,
            status: "active"
        };
        const addRes = await fetch(`${BASE_URL}/fixed-deposits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFD)
        });
        const added = await addRes.json();
        if (addRes.ok) console.log(`✅ Added: ${JSON.stringify(added.id)} - ${added.tenure}`);
        else console.error(`❌ Error: ${JSON.stringify(added)}`);
    } else if (fds.length > 4) {
        // If somehow there are more than 4, delete extras beyond 4
        console.log(`\n⚠️ More than 4 FDs found (${fds.length}), keeping first 4...`);
        const toDelete = fds.slice(4);
        for (const fd of toDelete) {
            const delRes = await fetch(`${BASE_URL}/fixed-deposits/${fd.id}`, { method: 'DELETE' });
            console.log(`🗑️ Deleted FD: ${fd.id} - ${delRes.ok ? 'OK' : 'Failed'}`);
        }
    } else {
        console.log('✅ Already have exactly 4 FDs, nothing to do.');
    }

    // Final count
    const final = await fetch(`${BASE_URL}/fixed-deposits`).then(r => r.json());
    console.log(`\nFinal FD count: ${final.length}`);
    final.forEach(f => console.log(`  [${f.id}] ${f.tenure} @ ${f.rate}% - ₹${f.principal.toLocaleString()}`));
}

run();
