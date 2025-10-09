<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Онкология</title>
    <link rel="stylesheet" href="css/index.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>

<body>

    <?php include __DIR__ . '/partials/header.php'; ?>

    <div class="container sections-wrapper">

        <?php include __DIR__ . '/partials/search.php'; ?>
        <?php include __DIR__ . '/partials/categories-section.php'; ?>
        <?php include __DIR__ . '/partials/latest-topics-section.php'; ?>
        <?php render_latest_topics_section(); ?>


    </div>

    <?php include __DIR__ . '/partials/footer.php'; ?>

</body>
<script src="js/scripts.js"></script>

</html>