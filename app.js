const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://davimartins_db_user:OTkNrXDSntQiWsea@cluster-monitoramento-v.kfyepcc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-monitoramento-vicios";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Conectar ao cliente
    await client.connect();
    console.log("Conectado ao MongoDB!");

    // Acessar a base de dados
    const db = client.db("monitoramento_vicios");

    // Criar a coleção de usuários sem inserir dados
    const usuariosCollection = db.collection("usuarios");
    console.log("Coleção 'usuarios' criada (ou já existe).");

    // Criar a coleção de hábitos sem inserir dados
    const habitosCollection = db.collection("habitos");
    console.log("Coleção 'habitos' criada (ou já existe).");

  } catch (error) {
    console.error("Erro na conexão com o MongoDB:", error);
  } finally {
    // Fechar a conexão
    await client.close();
  }
}
run().catch(console.dir);