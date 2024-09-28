package utilities;

import java.sql.*;
import java.util.*;

public class MySQLDataStoreUtilities {
    private static final String JDBC_DRIVER = "com.mysql.cj.jdbc.Driver";
    private static final String DB_URL = "jdbc:mysql://localhost:3306/smarthomes";
    private static final String USER = "root";
    private static final String PASS = "PasswOrd1!";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName(JDBC_DRIVER);
            return DriverManager.getConnection(DB_URL, USER, PASS);
        } catch (ClassNotFoundException e) {
            throw new SQLException("JDBC Driver not found", e);
        }
    }

    public static void close(Connection conn, Statement stmt, ResultSet rs) {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (SQLException se) {
            se.printStackTrace();
        }
    }

    public static int insertRecord(String tableName, Map<String, Object> columnValues) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        int generatedId = -1;

        try {
            conn = getConnection();
            StringBuilder sql = new StringBuilder("INSERT INTO " + tableName + " (");
            StringBuilder placeholders = new StringBuilder();
            List<Object> values = new ArrayList<>();

            for (Map.Entry<String, Object> entry : columnValues.entrySet()) {
                sql.append(entry.getKey()).append(",");
                placeholders.append("?,");
                values.add(entry.getValue());
            }

            sql.setLength(sql.length() - 1);  // Remove last comma
            placeholders.setLength(placeholders.length() - 1);  // Remove last comma
            sql.append(") VALUES (").append(placeholders).append(")");

            pstmt = conn.prepareStatement(sql.toString(), Statement.RETURN_GENERATED_KEYS);

            for (int i = 0; i < values.size(); i++) {
                pstmt.setObject(i + 1, values.get(i));
            }

            pstmt.executeUpdate();

            rs = pstmt.getGeneratedKeys();
            if (rs.next()) {
                generatedId = rs.getInt(1);
            }
        } finally {
            close(conn, pstmt, rs);
        }

        return generatedId;
    }

    public static int updateRecord(String tableName, Map<String, Object> columnValues, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsAffected = 0;

        try {
            conn = getConnection();
            StringBuilder sql = new StringBuilder("UPDATE " + tableName + " SET ");
            List<Object> values = new ArrayList<>();

            for (Map.Entry<String, Object> entry : columnValues.entrySet()) {
                sql.append(entry.getKey()).append(" = ?,");
                values.add(entry.getValue());
            }

            sql.setLength(sql.length() - 1);  // Remove last comma
            sql.append(" WHERE ").append(whereClause);

            pstmt = conn.prepareStatement(sql.toString());

            for (int i = 0; i < values.size(); i++) {
                pstmt.setObject(i + 1, values.get(i));
            }

            rowsAffected = pstmt.executeUpdate();
        } finally {
            close(conn, pstmt, null);
        }

        return rowsAffected;
    }

    public static int deleteRecord(String tableName, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        int rowsAffected = 0;

        try {
            conn = getConnection();
            String sql = "DELETE FROM " + tableName + " WHERE " + whereClause;
            pstmt = conn.prepareStatement(sql);
            rowsAffected = pstmt.executeUpdate();
        } finally {
            close(conn, pstmt, null);
        }

        return rowsAffected;
    }

    public static List<Map<String, Object>> getRecords(String tableName, String whereClause) throws SQLException {
        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Map<String, Object>> records = new ArrayList<>();

        try {
            conn = getConnection();
            String sql = "SELECT * FROM " + tableName;
            if (whereClause != null && !whereClause.isEmpty()) {
                sql += " WHERE " + whereClause;
            }
            pstmt = conn.prepareStatement(sql);
            rs = pstmt.executeQuery();

            ResultSetMetaData metaData = rs.getMetaData();
            int columnCount = metaData.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new HashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    String columnName = metaData.getColumnName(i);
                    Object value = rs.getObject(i);
                    row.put(columnName, value);
                }
                records.add(row);
            }
        } finally {
            close(conn, pstmt, rs);
        }

        return records;
    }
}