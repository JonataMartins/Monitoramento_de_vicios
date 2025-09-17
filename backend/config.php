<?php
$host = "localhost";
$dbname = "monitoramento_vicios";
$user = "root";  // usuário do MySQL do XAMPP
$pass = "";      // senha do MySQL do XAMPP

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["success" => false, "message" => "Erro DB: ".$e->getMessage()]));
}

// JWT secret simples
$jwt_secret = "segredo123";
?>
