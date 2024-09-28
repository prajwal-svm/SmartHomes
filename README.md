# React + Java Servlets Setup Guide

![localhost_5173_](https://github.com/user-attachments/assets/439ed129-f1c9-42f1-b43b-f54bfa071ec6)

> Apache Tomcat: https://dlcdn.apache.org/tomcat/tomcat-9/v9.0.94/bin/apache-tomcat-9.0.94.zip

To get started with the SmartHomes project, follow these steps:

1. **Place the Source Code**:
   Copy the source code into the `webapps` folder of your Tomcat installation, specifically under the `SmartHomes` directory.

2. **Start the Frontend Server**:
   Navigate to the frontend directory and run the following commands to install dependencies and start the frontend server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Deploy the Java Servlets**:
   Make the deployment script executable and run it to deploy the Java servlets:

   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Start MySQL Service**:
   Use Homebrew to start the MySQL service:

   ```bash
   brew services start mysql
   mysql -u root -p
   ```

5. **Start MongoDB Service**:
   Similarly, start the MongoDB service:

   ```bash
   brew services start mongodb-community@6.0
   mongosh
   ```

6. **Create the Database**:
   In the MySQL shell, create the `smarthomes` database and import the schema:

   ```sql
   CREATE DATABASE smarthomes;
   ```

7. **Verify Services**:
   Ensure that both MySQL and MongoDB services are running properly. You can check their status with:

   ```bash
   brew services list
   ```

8.  **Create MongoDB Collections**:
   In the MongoDB shell, create the `productReviews` collection:

   ```bash
   use smarthomes
   db.createCollection("productReviews")
   ```

9. **Import the mongo schema and data**:
   In the MongoDB shell, import the `mongoSchema.js` file:

   ```bash
   mongo smarthomes mongoSchema.mongo
   ```

10. **Access the Application**:
   Open your web browser and navigate to `http://localhost:5173` to access the SmartHomes application.
