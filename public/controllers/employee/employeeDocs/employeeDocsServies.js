"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const upload = async (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).send("No file uploaded.");
        return;
    }
    const location = file.location;
    res.send("Successfully uploaded " + location);
};
exports.upload = upload;
