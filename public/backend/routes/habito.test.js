require('dotenv').config(); 
const request = require('supertest');
const { expect } = require('chai');

const baseUrl = 'http://localhost:3000'; 
let nome_usuario = `usuarioTest_${Date.now()}`;  // Criando um nome de usuário único para cada execução
let senha = 'senha123';
let token = '';
let habitId = '';  // ID do hábito que será usado nos testes

// Testes para o gerenciamento de hábitos
describe('Testando as rotas de Hábito', () => {

  // Teste: Criar um novo usuário
  it('Deve criar um novo usuário', async () => {
    const res = await request(baseUrl)
      .post('/usuario/create')
      .send({ nome_usuario, senha });

    expect(res.status).to.equal(201);  
    expect(res.body.message).to.equal('Usuário criado com sucesso!');
  });

  // Teste: Login do usuário
  it('Deve realizar login com sucesso', async () => {
    const res = await request(baseUrl)
      .post('/usuario/login')
      .send({ nome_usuario, senha });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Login bem-sucedido');
    token = res.body.usuario.token;  // Armazenando o token para autenticação
  });

  // Teste: Criar um novo hábito
  it('Deve criar um novo hábito', async () => {
    const res = await request(baseUrl)
      .post('/habito/create')
      .set('Authorization', `Bearer ${token}`) // Enviando o token para autenticação
      .send({
        nome_usuario,
        nome_habito: 'Correr',
        descricao: 'Corrida diária para saúde'
      });

    expect(res.status).to.equal(201);  
    expect(res.body.message).to.equal('Hábito criado com sucesso!');
    expect(res.body.habito).to.have.property('_id');  // Garantindo que o hábito tem um ID
    habitId = res.body.habito._id;  // Armazenando o ID do hábito para os testes seguintes
  });

  // Teste: Listar hábitos do usuário
  it('Deve listar os hábitos do usuário', async () => {
    const res = await request(baseUrl)
      .post('/habito')  // Mantenha .post() como está no backend
      .set('Authorization', `Bearer ${token}`)  // Envia o token no header para autenticação
      .send({ nome_usuario });  // Envia o nome do usuário no corpo da requisição

    expect(res.status).to.equal(200);  // Espera um status 200
    expect(res.body).to.be.an('array');  // Espera que o corpo da resposta seja um array
    expect(res.body.length).to.be.greaterThan(0);  // Espera que o array de hábitos não esteja vazio
  });


  // Teste: Deletar um hábito
  it('Deve deletar um hábito', async () => {
    const res = await request(baseUrl)
      .delete('/habito/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome_usuario, habito_id: habitId });  // Usando o ID do hábito criado

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Hábito deletado com sucesso!');
  });

  // Teste: Não deve deletar um hábito inexistente
  it('Não deve deletar um hábito inexistente', async () => {
    const res = await request(baseUrl)
      .delete('/habito/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome_usuario,
        habito_id: '12345'  // ID fictício para testar erro
      });

    expect(res.status).to.equal(500);  
    expect(res.body.message).to.equal('Erro ao deletar hábito'); 
  });

});
