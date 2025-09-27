router.post('/login', async (req, res) => {
  const { nome_usuario, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ nome_usuario });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const senhaCriptografada = hashSenha(senha);

    if (usuario.senha !== senhaCriptografada) {
      return res.status(400).json({ message: 'Senha incorreta' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: usuario._id, 
        nome_usuario: usuario.nome_usuario 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    usuario.ultimo_token = token;
    await usuario.save();

    res.status(200).json({ 
      message: 'Login bem-sucedido', 
      usuario: {
        id: usuario._id,
        nome_usuario: usuario.nome_usuario
      },
      token 
    });
  } catch (err) {
    console.error("Erro ao fazer login:", err);
    res.status(500).json({ message: 'Erro ao fazer login!' });
  }
});