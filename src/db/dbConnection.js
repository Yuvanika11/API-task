import pg from "pg";
const Pool = pg.Pool;

const dbConnection = new Pool({
  database: "postgres",
  user: "postgres",
  password: "postgres",
  host: "localhost",
  port: 5432,
});

export default dbConnection;
