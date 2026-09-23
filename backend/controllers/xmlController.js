const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");

const getXMLProperties = async (req, res) => {
    try {
        const filePath = path.join(
            __dirname,
            "../xml/properties.xml"
        );

        const xmlData = fs.readFileSync(
            filePath,
            "utf-8"
        );

        const result = await xml2js.parseStringPromise(xmlData);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("XML parsing error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to parse XML file"
        });
    }
};

module.exports = {
    getXMLProperties
};