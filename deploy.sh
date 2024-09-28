#!/bin/bash

DEBUG=false

TOMCAT_HOME="/usr/local/apache-tomcat-9.0.94"
PROJECT_DIR="$TOMCAT_HOME/webapps/SmartHomes"
TOMCAT_LIB="$TOMCAT_HOME/lib/servlet-api.jar"
TOMCAT_BIN="$TOMCAT_HOME/bin"
JAVA_SOURCE_DIR="$PROJECT_DIR/WEB-INF/src"
COMPILED_CLASS_DIR="$PROJECT_DIR/WEB-INF/classes"
PROJECT_LIB_DIR="$PROJECT_DIR/WEB-INF/lib"

echo "1. 🛑 Stopping the Tomcat server..."
if [ "$DEBUG" = true ]; then
    "$TOMCAT_BIN/shutdown.sh" || { echo "Error stopping Tomcat server. ❌"; exit 1; }
else
    "$TOMCAT_BIN/shutdown.sh" &> /dev/null || { echo "Error stopping Tomcat server. ❌"; exit 1; }
fi

echo "2. 🧹 Cleaning up previous compilation..."
if [ "$DEBUG" = true ]; then
    rm -rf "$COMPILED_CLASS_DIR" || { echo "Error cleaning up previous compilation. ❌"; exit 1; }
else
    rm -rf "$COMPILED_CLASS_DIR" &> /dev/null
fi

echo "3. 🔨 Compiling Java files... Please wait!"
if [ "$DEBUG" = true ]; then
    javac -cp "$TOMCAT_LIB:$PROJECT_LIB_DIR/*" -d "$COMPILED_CLASS_DIR" \
        "$JAVA_SOURCE_DIR"/*.java \
        "$JAVA_SOURCE_DIR"/servlets/*.java || { echo "Error during compilation. ❌"; exit 1; }
else
    javac -cp "$TOMCAT_LIB:$PROJECT_LIB_DIR/*" -d "$COMPILED_CLASS_DIR" \
        "$JAVA_SOURCE_DIR"/*.java \
        "$JAVA_SOURCE_DIR"/servlets/*.java &> /dev/null || { echo "Error during compilation. ❌"; exit 1; }
fi

echo "4. ✅ Compilation completed successfully!"

sleep 1

echo "5. 🚀 Starting the Tomcat server..."
if [ "$DEBUG" = true ]; then
    "$TOMCAT_BIN/startup.sh" || { echo "Error starting Tomcat server. ❌"; exit 1; }
else
    "$TOMCAT_BIN/startup.sh" &> /dev/null || { echo "Error starting Tomcat server. ❌"; exit 1; }
fi

echo "6. 🏁 Tomcat server has been restarted successfully!"

sleep 1

# Health check
HEALTH_CHECK_URL="http://localhost:8080/SmartHomes/test"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_CHECK_URL)
if [ "$HTTP_RESPONSE" -eq 200 ]; then
    echo "7. 💡 SmartHomes is healthy!"
else
    echo "Health check failed with response code: $HTTP_RESPONSE. ❌"
    exit 1
fi