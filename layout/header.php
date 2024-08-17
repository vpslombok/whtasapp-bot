<!DOCTYPE html>
<html lang="en">

<head>
  <title>WA API GATEWAY</title>
  <meta name="description" content="WhatsApp API otomatis." />
  <meta charset="UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, minimum-scale=1.0, initial-scale=1.0, user-scalable=yes" />
  <link rel="icon" href="./assets/icon.svg" />
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://unpkg.com/htmx.org@1.9.19"></script>
  <style>
    body {
      background: rgb(200, 220, 224);
      font-family: Arial, sans-serif, 'Poppins', sans-serif, 'Poppins', sans-serif;
    }

    .sidebar {
      width: 250px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: #007bff;
      color: #fff;
      padding: 20px;
      display: none;
      flex-direction: column;
    }

    .sidebar.active {
      display: flex;
    }

    .sidebar h2 {
      margin-bottom: 20px;
      font-size: 24px;
    }

    .sidebar ul {
      list-style: none;
      padding: 0;
    }

    .sidebar ul li {
      margin-bottom: 10px;
    }

    .sidebar ul li a {
      color: #fff;
      text-decoration: none;
      font-size: 18px;
    }

    .sidebar ul li a:hover {
      color: #000;
    }

    .hamburger {
      display: none;
      font-size: 30px;
      cursor: pointer;
      position: fixed;
      top: 5px;
      left: 5px;
      z-index: 100;
    }

    .content {
      margin-left: 10px;
      padding: 20px;
      transition: margin-left 0.3s;
      margin-top: 20px;
    }

    @media (min-width: 768px) {
      .sidebar {
        display: flex;
        background: #007bff;
      }

      .hamburger {
        display: none;
      }

      .content {
        margin-left: 250px;
      }
    }
    @media (max-width: 767px) {
      .hamburger {
        display: block;
      }

      .sidebar {
        display: none;
      }

      .sidebar.active {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 250px;
        height: 100vh;
        background: #007bff;
        z-index: 99;
      }

      .content {
        margin-left: 0;
      }
    }

    .form {
      max-width: 400px;
      margin: 10px auto;
      text-align: center;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .form-reply {
      width: 100%;
      margin: 10px auto;
      text-align: center;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .form-riwayat {
      width: 100%;
      margin: 10px auto;
      text-align: center;
      padding: 12px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .form h1 {
      background: #007bff;
      padding: 12px 0;
      font-weight: 300;
      text-align: center;
      color: #fff;
      margin: 0;
      font-size: 22px;
      border-radius: 8px 8px 0 0;
      width: 100%;
      box-sizing: border-box;
    }

    .form img {
      width: 250px;
      height: 250px;
      object-fit: cover;
      margin-top: 20px;
      display: block;
    }

    .form .loading {
      width: 250px;
      height: 250px;
      background: url("./assets/loader.gif") no-repeat center;
      background-size: contain;
      margin-top: 20px;
    }

    .user-info-container {
      margin-top: 20px;
    }

    .qrcode-container {
      display: none;
    }

    .folder-container {
      display: none;
    }

    .setting-container {
      display: none;
    }
  </style>
</head>

<body>
  <div class="hamburger" id="hamburger">
    <i class="fas fa-bars"></i>
  </div>