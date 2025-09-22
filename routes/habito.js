const express = require('express');
const Habito = require('../models/habito');
const Usuario = require('../models/usuario');
const router = express.Router();

/**
 * @swagger
 * /create:
 *   post:
 *     summary: Cria um novo hábito
 *     description: Associa um hábito a um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id:
 *                 type: string
 *                 description: ID do usuário associado ao hábito
 *                 example: "64d034ac418e1f5b800d88c7"
 *               nome_habito:
 *                 type: string
 *                 description: Nome do hábito
 *                 example: "Beber água"
 *               descricao:
 *                 type: string
 *                 description: Descrição do hábito
 *                 example: "Beber 2 litros de água por dia"
 *     responses:
 *       201:
 *         description: Hábito criado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/create', async (req, res) => {
  const { usuario_id, nome_habito, descricao } = req.body;

  try {
    const usuarioExistente = await Usuario.findById(usuario_id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const novoHabito = new Habito({
      usuario_id,
      nome_habito,
      descricao,
    });

    await novoHabito.save();

    res.status(201).json({ message: 'Hábito criado com sucesso!', habito: novoHabito });
  } catch (err) {
    console.error("Erro ao criar hábito:", err);
    res.status(500).json({ message: 'Erro ao criar hábito!' });
  }
});

module.exports = router;
