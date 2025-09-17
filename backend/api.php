<?php
header('Content-Type: application/json');
require "config.php";
require "auth.php";

// lê entrada JSON
$input = json_decode(file_get_contents("php://input"), true);
$action = $_GET['action'] ?? '';

// pega token do header Authorization
$headers = getallheaders();
$token = null;
if(isset($headers['Authorization'])) {
    if(preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

// ações da API
if($action === "login") {
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    if(!$username || !$password) {
        echo json_encode(["success"=>false,"message"=>"Faltando dados"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username=? AND password=MD5(?)");
    $stmt->execute([$username,$password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if($user) {
        $jwt = generateJWT($user['id']);
        echo json_encode(["success"=>true,"token"=>$jwt]);
    } else {
        echo json_encode(["success"=>false,"message"=>"Usuário ou senha inválidos"]);
    }
    exit;
}

$userId = verifyJWT($token);
if(!$userId) {
    echo json_encode(["success"=>false,"message"=>"Token inválido"]);
    exit;
}

if($action === "addHabit") {
    $name = $input['name'] ?? '';
    if(!$name) {
        echo json_encode(["success"=>false,"message"=>"Nome do hábito vazio"]);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO habits(user_id,name) VALUES(?,?)");
    $stmt->execute([$userId,$name]);
    echo json_encode(["success"=>true]);
    exit;
}

if($action === "getHabits") {
    $stmt = $pdo->prepare("SELECT name, start FROM habits WHERE user_id=? ORDER BY start DESC");
    $stmt->execute([$userId]);
    $habits = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($habits);
    exit;
}

echo json_encode(["success"=>false,"message"=>"Ação inválida"]);
?>
