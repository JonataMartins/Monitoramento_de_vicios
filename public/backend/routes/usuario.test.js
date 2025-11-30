require('dotenv').config(); 
const request = require('supertest');
const { expect } = require('chai');

const baseUrl = 'http://localhost:3000'; 
describe('Testando as rotas de Usuário', () => {
  let nome_usuario = `usuarioTest_${Date.now()}`; 
  let senha = 'senha123';
  let token = '';

  // Teste: Criar um novo usuário
  it('Deve criar um novo usuário', async () => {
    const res = await request(baseUrl)
      .post('/usuario/create')
      .send({ nome_usuario, senha });

    expect(res.status).to.equal(201);  
    expect(res.body.message).to.equal('Usuário criado com sucesso!');
  });

  // Teste: Login de um usuário
  it('Deve realizar login com sucesso', async () => {
    const res = await request(baseUrl)
      .post('/usuario/login')
      .send({ nome_usuario, senha });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Login bem-sucedido');
    token = res.body.usuario.token; 
  });

  // Teste: Tentar realizar login com senha incorreta
  it('Não deve realizar login com senha incorreta', async () => {
    const res = await request(baseUrl)
      .post('/usuario/login')
      .send({ nome_usuario, senha: 'senhaErrada' });

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal('Senha incorreta');
  });

  // Teste: Trocar senha
  it('Deve alterar a senha do usuário', async () => {
    const novaSenha = 'novaSenha123';

    const res = await request(baseUrl)
      .put('/usuario/trocarSenha')
      .set('Authorization', `Bearer ${token}`) 
      .send({ nome_usuario, senha_antiga: senha, senha_nova: novaSenha });

    expect(res.status).to.equal(200); 
    expect(res.body.message).to.equal('Senha alterada com sucesso!');
  });

  // Teste: Excluir usuário
  it('Deve excluir um usuário', async () => {
    const res = await request(baseUrl)
      .delete('/usuario/delete')
      .send({ nome_usuario });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Usuário excluído com sucesso!');
  });
});
