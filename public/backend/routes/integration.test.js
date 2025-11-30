require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');

const baseUrl = 'http://localhost:3000'; 
let nome_usuario = `usuarioTest_${Date.now()}`; 
let senha = 'senha123';
let token = '';
let habitId = '';

describe('Teste de Integração - Usuário e Hábito', () => {

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

  // Teste: Criar um novo hábito para o usuário
  it('Deve criar um novo hábito para o usuário', async () => {
    const res = await request(baseUrl)
      .post('/habito/create')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome_usuario,
        nome_habito: 'Correr',
        descricao: 'Corrida diária',
      });

    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal('Hábito criado com sucesso!');
    expect(res.body.habito).to.have.property('_id');
    habitId = res.body.habito._id; 
  });

  // Teste: Listar hábitos do usuário
  it('Deve listar os hábitos do usuário', async () => {
    const res = await request(baseUrl)
      .post('/habito')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_usuario });

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);  
  });

  // Teste: Deletar um hábito criado
  it('Deve deletar o hábito criado', async () => {
    const resDelete = await request(baseUrl)
      .delete('/habito/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_usuario, habito_id: habitId });

    expect(resDelete.status).to.equal(200);
    expect(resDelete.body.message).to.equal('Hábito deletado com sucesso!');
  });

  // Teste: Excluir o usuário
  it('Deve excluir o usuário', async () => {
    const res = await request(baseUrl)
      .delete('/usuario/delete')
      .send({ nome_usuario });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Usuário excluído com sucesso!');
  });

});
