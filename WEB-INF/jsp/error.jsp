<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oops! Something went wrong - ShopEase</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap');

        body {
            font-family: 'Nunito', sans-serif;
            background-color: #f7f7f7;
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 90%;
            width: 500px;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #e53e3e;
            margin-bottom: 1rem;
        }

        p {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            color: #4a5568;
        }

        .btn {
            display: inline-block;
            text-decoration: none;
            color: white;
            background-color: #3182ce;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }

        .btn:hover {
            background-color: #2c5282;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background-color: #718096;
        }

        .btn-secondary:hover {
            background-color: #4a5568;
        }

        .error-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            animation: bounce 2s ease infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h1>Oops! Something went wrong</h1>
        <p>We're sorry, but it looks like there was a hiccup in our system. Don't worry, your shopping cart is safe!</p>
        <p>You can try refreshing the page or come back a little later. Our team is already working on fixing this issue.</p>
        <a href="/" class="btn">Return to Homepage</a>
        <a href="/contact" class="btn btn-secondary">Contact Support</a>
    </div>
</body>
</html>
