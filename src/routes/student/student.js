import express from "express";

import fetchDetail from "../../controller/studentController/fetchDetail.js";
import fetchAllRank from "../../controller/studentController/fetchAllRank.js";

const studentRouter = express.Router();

studentRouter.get("/fetchDetail/:user_id", fetchDetail);
studentRouter.get("/fetchAllRank", fetchAllRank);

export default studentRouter;
