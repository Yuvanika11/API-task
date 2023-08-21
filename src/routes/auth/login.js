import express from "express";

import { login } from "../../controller/authController/login.js";

const authRouter = express.Router();

authRouter.post("/login", login);

export default authRouter;
