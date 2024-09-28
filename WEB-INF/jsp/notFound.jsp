<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            max-width: 90%;
            width: 500px;
        }

        h1 {
            font-size: 4rem;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 1rem;
            animation: pulse 2s infinite;
        }

        p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            color: #4b5563;
        }

        a {
            display: inline-block;
            text-decoration: none;
            color: white;
            background-color: #4f46e5;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        a:hover {
            background-color: #4338ca;
            transform: translateY(-2px);
        }

        .astronaut {
            width: 100px;
            height: 100px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%234f46e5' d='M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 398.7c-105.1 0-190.7-85.5-190.7-190.7 0-105.1 85.5-190.7 190.7-190.7 105.1 0 190.7 85.5 190.7 190.7 0 105.1-85.6 190.7-190.7 190.7z'/%3E%3Cpath fill='%234f46e5' d='M256 96c-88.4 0-160 71.6-160 160s71.6 160 160 160 160-71.6 160-160-71.6-160-160-160zm91.9 116.5L236.5 323.9c-4.7 4.7-12.3 4.7-17 0l-44.5-44.5c-4.7-4.7-4.7-12.3 0-17s12.3-4.7 17 0l35.9 35.9 102.1-102.1c4.7-4.7 12.3-4.7 17 0 4.8 4.7 4.8 12.3.1 17z'/%3E%3C/svg%3E");
            background-size: contain;
            margin: 0 auto 2rem;
            animation: float 6s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="astronaut"></div>
        <h1>404</h1>
        <p>Oops! Looks like you've ventured into uncharted space.</p>
        <a href="/">Return to Earth</a>
    </div>
</body>
</html>
