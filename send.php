<?php
header('Content-Type: application/json; charset=utf-8');

$to = "alexander.pasmurnov@yandex.ru"; // ← сюда вставь свою почту
$subject = $_POST['subject'] ?? 'Сообщение с сайта';
$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$email = $_POST['email'] ?? '';
$message = $_POST['message'] ?? '';

$body = "Тема: $subject\n\nИмя: $name\nТелефон: $phone\nEmail: $email\n\nСообщение:\n$message";

$headers = "From: no-reply@" . $_SERVER['SERVER_NAME'] . "\r\n" .
    "Content-Type: text/plain; charset=utf-8\r\n";

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false]);
}
