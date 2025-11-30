require('dotenv').config(); 
const request = require('supertest');
const { expect } = require('chai');

describe('Testando as rotas de Hábito', () => {
  let habitId = ''; 
  const nome_usuario = 'lucas'; 

  // Teste: Criar um novo hábito
  it('Deve criar um novo hábito', async () => {
    const res = await request('http://localhost:3000')  
      .post('/habito/create')  
      .send({
        nome_usuario, 
        nome_habito: 'Correr',  
        descricao: 'Corrida diária' 
      });

   
    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal('Hábito criado com sucesso!');
    expect(res.body.habito).to.have.property('_id'); 
    expect(res.body.habito.nome_habito).to.equal('Correr');  
  
    habitId = res.body.habito._id;
  });

  // Teste: Listar hábitos do usuário
  it('Deve listar os hábitos do usuário', async () => {
    const res = await request('http://localhost:3000')
      .post('/habito')  
      .send({ nome_usuario }); 

    
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.greaterThan(0);  
  });

  // Teste: Deletar um hábito
  it('Deve deletar um hábito', async () => {
    
    const resCreate = await request('http://localhost:3000') 
      .post('/habito/create')
      .send({
        nome_usuario,  
        nome_habito: 'Ler um livro',
        descricao: 'Leitura diária de livros'
      });

   
    const habitoId = resCreate.body.habito._id;

 
    const resDelete = await request('http://localhost:3000')  
      .delete('/habito/delete')
      .send({ nome_usuario, habito_id: habitoId });

    
    expect(resDelete.status).to.equal(200);
    expect(resDelete.body.message).to.equal('Hábito deletado com sucesso!');
  });

  // Teste: Não deve deletar um hábito inexistente
    it('Não deve deletar um hábito inexistente', async () => {
    const resDelete = await request('http://localhost:3000')  
        .delete('/habito/delete')
        .send({
        nome_usuario, 
        habito_id: '12345' 
        });

    expect(resDelete.status).to.equal(500);  
    expect(resDelete.body.message).to.equal('Erro ao deletar hábito'); 
    });

});
