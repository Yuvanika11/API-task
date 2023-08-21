import express from "express";

import fetchAll from "../../controller/adminController/fetchAll.js";
import createOne from "../../controller/adminController/createOne.js";
import deleteOne from "../../controller/adminController/deleteOne.js";
import editOne from "../../controller/adminController/editOne.js";
import publishResult from "../../controller/adminController/publishResult.js";

const adminRouter = express.Router();

adminRouter.get("/fetchAll", fetchAll);
adminRouter.post("/createOne", createOne);
adminRouter.delete("/deleteOne/:user_id", deleteOne);
adminRouter.put("/editOne", editOne);
adminRouter.get("/publishResult", publishResult);

export default adminRouter;
