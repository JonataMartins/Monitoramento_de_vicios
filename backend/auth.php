<?php
require "config.php";

// Funções simples de JWT sem biblioteca externa
function generateJWT($userId) {
    global $jwt_secret;
    $header = json_encode(['typ'=>'JWT','alg'=>'HS256']);
    $payload = json_encode(['sub'=>$userId,'iat'=>time(),'exp'=>time()+86400]);
    $base64UrlHeader = str_replace(['+','/','='],['-','_',''], base64_encode($header));
    $base64UrlPayload = str_replace(['+','/','='],['-','_',''], base64_encode($payload));
    $signature = hash_hmac('sha256', "$base64UrlHeader.$base64UrlPayload", $jwt_secret, true);
    $base64UrlSignature = str_replace(['+','/','='],['-','_',''], base64_encode($signature));
    return "$base64UrlHeader.$base64UrlPayload.$base64UrlSignature";
}

function verifyJWT($token) {
    global $jwt_secret;
    $parts = explode('.', $token);
    if(count($parts) !== 3) return false;

    list($header64, $payload64, $sig64) = $parts;
    $signature = hash_hmac('sha256', "$header64.$payload64", $jwt_secret, true);
    $verify = str_replace(['+','/','='],['-','_',''], base64_encode($signature));

    if(!hash_equals($verify, $sig64)) return false;

    $payload = json_decode(base64_decode($payload64));
    if($payload->exp < time()) return false;

    return $payload->sub;
}
?>
