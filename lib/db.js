import mysql from "mysql2/promise";
// import bluebird from "bluebird";

export async function query({ query, values = [] }) {
  const dbconnection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    socketPath: process.env.MYSQL_SOCKETPATH,
    // Promise: bluebird,
  });
  try {
    const [results] = await dbconnection.execute(query, values);
    dbconnection.end();
    return results;
  } catch (error) {
    throw Error(error.message);
    return { error };
  }
}
