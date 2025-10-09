<?php
// send-feedback.php
// -----------------
// Принимает POST: subject, name, phone, (email необяз.), message
// Возвращает JSON: { success: bool, error?: string }

declare(strict_types=1);

// ====== НАСТРОЙКИ ======
$TO_EMAIL = 'alexander.pasmurnov@yandex.ru';         // ← укажи почту получателя
$FROM_EMAIL = 'no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'localhost');
$PROJECT = 'Онкология.РУ — форма отзыва';

// ====== ВСПОМОГАТЕЛЬНЫЕ ======
function json_response(int $code, array $data): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function get_post(string $key, bool $trim = true): ?string
{
    $val = $_POST[$key] ?? null;
    if ($val === null)
        return null;
    $val = is_string($val) ? $val : (string) $val;
    return $trim ? trim($val) : $val;
}

// ====== ПРОВЕРКИ ЗАПРОСА ======
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

// Простая защита от слишком больших тел
$maxBytes = 1024 * 64; // 64 KB
if (!empty($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > $maxBytes) {
    json_response(413, ['success' => false, 'error' => 'Payload Too Large']);
}

// ====== ДАННЫЕ ======
$subject = get_post('subject') ?: 'Сообщение с сайта';
$name = get_post('name') ?: '';
$phone = get_post('phone') ?: '';
$email = get_post('email') ?: ''; // у формы отзыва может не быть email — ок
$message = get_post('message') ?: '';

// Валидация
$errors = [];
if ($name === '') {
    $errors[] = 'Укажите имя.';
}
if ($phone === '') {
    $errors[] = 'Укажите телефон.';
}
if ($message === '') {
    $errors[] = 'Напишите сообщение.';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Неверный email.';
}
if ($errors) {
    json_response(422, ['success' => false, 'error' => implode(' ', $errors)]);
}

// Санитайз для письма (без опасных символов)
$sanitize = static function (string $s): string {
    // убираем \r и \n в полях заголовков/тела
    return str_replace(["\r", "\n"], [' ', ' '], $s);
};

$subjectSafe = $sanitize($subject);
$nameSafe = $sanitize($name);
$phoneSafe = $sanitize($phone);
$emailSafe = $sanitize($email);

// ====== СБОРКА ПИСЬМА ======
$bodyLines = [
    "Проект: $PROJECT",
    "Тема: $subjectSafe",
    "Имя: $nameSafe",
    "Телефон: $phoneSafe",
];
if ($emailSafe !== '') {
    $bodyLines[] = "Email: $emailSafe";
}
$bodyLines[] = "";
$bodyLines[] = "Сообщение:";
$bodyLines[] = $message; // текст сообщения можно оставить как есть

$body = implode("\n", $bodyLines);

// Заголовки (UTF-8)
$encodedSubject = '=?UTF-8?B?' . base64_encode($subjectSafe) . '?=';
$headers = [];
$headers[] = "From: $FROM_EMAIL";
if ($emailSafe !== '') {
    // Чтобы можно было ответить
    $headers[] = "Reply-To: $emailSafe";
}
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=utf-8";
$headers[] = "Content-Transfer-Encoding: 8bit";

$headersStr = implode("\r\n", $headers);

// ====== ОТПРАВКА ======
$sent = @mail($TO_EMAIL, $encodedSubject, $body, $headersStr);

if ($sent) {
    json_response(200, ['success' => true]);
} else {
    json_response(500, ['success' => false, 'error' => 'Не удалось отправить письмо.']);
}
