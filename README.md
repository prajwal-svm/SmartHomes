# React + Java Servlets Setup Guide

![smart_homes](https://github.com/user-attachments/assets/770beb3a-bc3e-4e97-9c4c-5954a6ff8469)

> Apache Tomcat: https://dlcdn.apache.org/tomcat/tomcat-9/v9.0.94/bin/apache-tomcat-9.0.94.zip

To get started with the SmartHomes project, follow these steps:

1. **Place the Source Code**:
   Copy the source code into the `webapps` folder of your Tomcat installation, specifically under the `SmartHomes` directory.

   ```bash
   # /usr/local/apache-tomcat-9.0.94/webapps/SmartHomes/.env
   OPENAI_API_KEY=your_openai_key_here
   UPLOAD_DIR=/usr/local/apache-tomcat-9.0.94/webapps/SmartHomes/uploads
   DB_URL=jdbc:mysql://localhost:3306/smartHomes
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   ELASTIC_API_KEY=your_elastic_api_key_here
   ```

   1.1 Run elastic search migration

   ```bash
   cd seed-elastic-search
   npm install
   npm run migrate
   ```

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

8. **Create MongoDB Collections**:
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
