#!/bin/bash

TOMCAT_HOME="/usr/local/apache-tomcat-9.0.94"
PROJECT_DIR="$TOMCAT_HOME/webapps/SmartHomes"
TOMCAT_LIB="$TOMCAT_HOME/lib/servlet-api.jar"
PROJECT_LIB_DIR="$PROJECT_DIR/WEB-INF/lib"
COMPILED_CLASS_DIR="$PROJECT_DIR/WEB-INF/classes"
TEST_SOURCE_DIR="$PROJECT_DIR/WEB-INF/src/tests"

echo "Compiling test files..."
javac -Xlint:deprecation -cp "$TOMCAT_LIB:$PROJECT_LIB_DIR/*:$COMPILED_CLASS_DIR" -d "$COMPILED_CLASS_DIR" $TEST_SOURCE_DIR/*.java

if [ $? -eq 0 ]; then
    echo "Compilation successful. Running tests..."
    java -cp "$TOMCAT_LIB:$PROJECT_LIB_DIR/*:$COMPILED_CLASS_DIR" tests.CRUDGetTests
else
    echo "Compilation failed. Please check your code and try again."
fi