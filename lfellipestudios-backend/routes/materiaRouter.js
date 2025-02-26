const express = require('express');
const router = express.Router();
const multer = require('multer');
const { criarMateria, getMaterias } = require('../controllers/materiaController');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Rotas
router.post('/', upload.single('imagem'), criarMateria);
router.get('/', getMaterias);

module.exports = router;
