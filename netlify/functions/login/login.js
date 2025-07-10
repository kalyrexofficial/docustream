const { Client } = require("pg");

exports.handler = async function (event) {
  const { email, password } = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
  });

  try {
    await client.connect();

    // Check if user exists
    const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      if (user.password === password) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Login successful", user_id: user.id }),
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Incorrect password" }),
        };
      }
    } else {
      // Register new user
      const newUser = await client.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
        [email, password]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Registered successfully", user_id: newUser.rows[0].id }),
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  } finally {
    await client.end();
  }
};
