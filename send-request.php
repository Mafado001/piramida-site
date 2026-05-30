<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Метод не поддерживается']);
    exit;
}

$toEmail = 'pira.mida61ros@gmail.com';

$name = trim((string) ($_POST['name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$project = trim((string) ($_POST['project'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Укажите имя и телефон.']);
    exit;
}

if (strlen($name) > 120 || strlen($phone) > 40 || strlen($email) > 120 || strlen($message) > 4000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Слишком длинное сообщение.']);
    exit;
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Некорректный email.']);
    exit;
}

$subject = 'Новая заявка с сайта Пирамида';
$lines = [
    'Новая заявка с сайта «Пирамида»',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
];
if ($email !== '') {
    $lines[] = 'Email: ' . $email;
}
if ($project !== '') {
    $lines[] = 'Проект: ' . $project;
}
if ($message !== '') {
    $lines[] = '';
    $lines[] = 'Сообщение:';
    $lines[] = $message;
}
$lines[] = '';
$lines[] = 'Дата: ' . date('d.m.Y H:i:s');
$lines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '—');

$body = implode("\n", $lines);
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

$fromHost = preg_replace('/[^a-z0-9.-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: noreply@' . $fromHost,
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = @mail($toEmail, $encodedSubject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(500);
echo json_encode([
    'ok' => false,
    'error' => 'Почтовый сервер недоступен. Позвоните: +7 (928) 229-65-45',
]);
