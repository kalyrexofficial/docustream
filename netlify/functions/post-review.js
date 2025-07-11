const { Client } = require('pg');

exports.handler = async (event) => {
  const { email, script_id, review } = JSON.parse(event.body);

  if (!email || !script_id || !review) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing fields' }),
    };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check if user exists
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;

    if (userRes.rows.length === 0) {
      const newUser = await client.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
        [email, 'auth0-google']
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }

    // Save review
    await client.query(
      'INSERT INTO reviews (user_id, script_id, review) VALUES ($1, $2, $3)',
      [userId, script_id, review]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Review submitted successfully' }),
    };
  } catch (err) {
    console.error('Error posting review:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database error' }),
    };
  }
};
