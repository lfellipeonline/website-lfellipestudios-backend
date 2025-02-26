require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const materiaRoutes = require('./routes/materiaRouter');

const app = express();
const PORT = process.env.PORT || 5000;

// Modelo de Usuário
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Configurações iniciais
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Utilitários JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const handleAuthError = (res, message, statusCode = 401) => {
  return res.status(statusCode).json({ success: false, message });
};

// Middleware de autenticação
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return handleAuthError(res, 'Token não fornecido');

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return handleAuthError(res, 'Token inválido ou expirado', 403);
    
    try {
      const user = await User.findById(decoded.userId);
      if (!user) return handleAuthError(res, 'Usuário não encontrado');
      
      req.user = user;
      next();
    } catch (error) {
      handleAuthError(res, 'Erro na verificação do usuário');
    }
  });
};

app.post('/api/validateToken', authenticateJWT, (req, res) => {
  res.json({ 
    success: true,
    user: req.user 
  });
});

// Rotas de autenticação
app.post('/api/authenticate', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return handleAuthError(res, 'Credenciais inválidas');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return handleAuthError(res, 'Credenciais inválidas');

    res.json({ 
      success: true, 
      token: generateToken(user._id),
      username: user.username
    });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    handleAuthError(res, 'Erro no servidor', 500);
  }
});



// Rota de registro (opcional)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return handleAuthError(res, 'Usuário já existe');

    const newUser = new User({ username, password });
    await newUser.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Usuário registrado com sucesso' 
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    handleAuthError(res, 'Erro no servidor', 500);
  }
});

// Rotas protegidas
app.get('/protected', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'Acesso autorizado', 
    user: req.user.username 
  });
});

// Rotas de matérias
app.use('/api/materias', authenticateJWT, materiaRoutes);

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch(err => console.error('Erro na conexão com MongoDB:', err));