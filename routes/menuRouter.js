const { Router } = require("express");
const menuController = require("../controllers/menuController");

const menuRouter = Router();

menuRouter.get("/search", menuController.search);
menuRouter.get("/:id", menuController.getOne);
menuRouter.get("/", menuController.getAll);
menuRouter.post("/", menuController.create);
menuRouter.put("/:id", menuController.updateOne);
menuRouter.delete("/:id", menuController.remove);

module.exports = menuRouter;
