const Materia = require('../models/materia');

// Criar matéria
exports.criarMateria = async (req, res) => {
  try {
    const { titulo, conteudo } = req.body;
    const imagem = req.file ? req.file.filename : null;

    const novaMateria = new Materia({ titulo, conteudo, imagem });
    const materiaSalva = await novaMateria.save();
    res.status(201).json(materiaSalva);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao criar matéria', error });
  }
};

// Buscar todas as matérias
exports.getMaterias = async (req, res) => {
  try {
    const materias = await Materia.find().sort({ criadoEm: -1 });
    res.status(200).json(materias);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar matérias', error });
  }
};
