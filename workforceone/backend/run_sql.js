const fs = require('fs');
const { Client } = require('pg');

async function runSQL() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL.replace('?sslmode=require&supa=base-pooler.x', ''),
        ssl: {
            rejectUnauthorized: false
        }
    });
    
    try {
        await client.connect();
        
        const sql = fs.readFileSync('../database/complete_rls_fix.sql', 'utf8');
        
        console.log('Running RLS fix SQL...');
        const result = await client.query(sql);
        
        console.log('Success! RLS policies have been applied.');
        if (result.rows && result.rows.length > 0) {
            console.log('Result:', result.rows);
        }
        
    } catch (error) {
        console.error('Error running SQL:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runSQL();