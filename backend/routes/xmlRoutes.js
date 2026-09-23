const express = require("express");

const {
    getXMLProperties
} = require("../controllers/xmlController");

const router = express.Router();

router.get("/properties", getXMLProperties);

module.exports = router;