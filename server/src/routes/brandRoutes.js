const router = require("express").Router();
const { listBrands } = require("../controllers/brandController");

router.get("/", listBrands);

module.exports = router;
