import multer from "multer";

// Configure storage for multiple file uploads
const storage = multer.diskStorage({});

const upload = multer({ storage: storage });

export default upload;
