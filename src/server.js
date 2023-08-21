import * as env from "dotenv";
env.config();

import express from "express";
import bodyParser from "body-parser";
import prisma from "./db/client.js";
import properties from "./config/properties.js";

import authRouter from "./routes/auth/login.js";
import adminRouter from "./routes/admin/admin.js";
import studentRouter from "./routes/student/student.js";

const app = express();
app.use(bodyParser.json());

app.use("/users", authRouter);
app.use("/admin", adminRouter);
app.use("/student", studentRouter);

const port = properties.port;

prisma
  .$connect()
  .then(() => {
    console.log("database connection established");
    app.listen(port, () => {
      console.log(`listening on ${port}`);
    });
  })
  .catch((err) => console.log(err));
