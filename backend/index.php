<?php

/**
 * Entry point Laravel untuk deployment Hostinger subfolder.
 *
 * Aplikasi diakses via https://<domain>/backend (folder `public/` disembunyikan).
 * Karena berkas ini berada di root aplikasi, Apache menetapkan
 * SCRIPT_NAME = `/backend/index.php`, sehingga base URL Laravel = `/backend`
 * dan path info tidak mengandung `/public` — routing `/api/...` tetap tepat.
 *
 * `public/index.php` tetap dipakai apa adanya (local `php artisan serve`) karena
 * semua path relatifnya berbasis `__DIR__` folder `public/`.
 */
require __DIR__.'/public/index.php';
