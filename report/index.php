<?php

header("Content-Type: text/plain; charset=utf-8");

if (isset($_GET['data'])) {
    echo $_GET['data'];
}
