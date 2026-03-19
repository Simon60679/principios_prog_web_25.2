import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Verifica se a pasta "uploads" existe na raiz do projeto. Se não, ele cria automaticamente
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Salva fisicamente na pasta uploads
  },
  filename: (req, file, cb) => {
    // Cria um nome único com a data atual + a extensão original do arquivo (.jpg, .png)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Limita a foto a 5MB
});

export default upload;