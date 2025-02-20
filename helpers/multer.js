const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname,"../public/uploads/re-image"))
    },
    filename: (req, file, cb) => {
        cb(null,Date.now()+"-"+file.originalname);
    }
})
const upload = multer({
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024, 
        fieldSize: 10 * 1024 * 1024,
        files: 5    ,                
    }
});


module.exports = storage;