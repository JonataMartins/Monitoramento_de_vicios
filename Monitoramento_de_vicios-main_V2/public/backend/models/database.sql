CREATE DATABASE IF NOT EXISTS monitoramento_vicios;
USE monitoramento_vicios;

-- Tabela de usuários
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_usuario VARCHAR(50) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL
);

-- Tabela de hábitos
CREATE TABLE habitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  maior_periodo_sem_vicio INT DEFAULT 0, 
  recaidas INT DEFAULT 0,                
  media_periodo_sem_recaidas INT DEFAULT 0,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Usuário inicial para testes (senha: 1234)
INSERT INTO usuarios (nome_usuario, senha) VALUES ('teste', MD5('1234'));
