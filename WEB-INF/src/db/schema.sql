-- Create the smarthomes database
CREATE DATABASE IF NOT EXISTS smarthomes;

-- Use the smarthomes database
USE smarthomes;

-- Users Table: Stores information about all users (StoreManager, Customer, SalesPerson)
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) UNIQUE,
    PasswordHash VARCHAR(255),
    UserType ENUM('Customer', 'StoreManager', 'SalesPerson'),
    FullName VARCHAR(255),
    Age INT,
    Gender VARCHAR(10),
    Street VARCHAR(255),
    City VARCHAR(100),
    State VARCHAR(50),
    ZipCode VARCHAR(10),
    Email VARCHAR(255),
    PhoneNumber VARCHAR(15),
    Occupation VARCHAR(100),
    ProfilePicture VARCHAR(255)
);

-- Stores Table: Stores information about store locations
CREATE TABLE Stores (
    StoreID INT AUTO_INCREMENT PRIMARY KEY,
    StoreName VARCHAR(255),
    Street VARCHAR(255),
    City VARCHAR(100),
    State VARCHAR(50),
    ZipCode VARCHAR(10)
);

-- Products Table: Stores information about products
CREATE TABLE Products (
    ProductID INT AUTO_INCREMENT PRIMARY KEY,
    ProductModelName VARCHAR(255),
    ProductCategory VARCHAR(100),
    ProductPrice DECIMAL(10, 2),
    ProductOnSale BOOLEAN,
    ManufacturerName VARCHAR(255),
    ManufacturerRebate BOOLEAN,
    Inventory INT DEFAULT 0,
    ProductImage VARCHAR(255),
    ProductDescription TEXT
);

-- Product Accessories Table: Stores information about accessories
CREATE TABLE ProductAccessories (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT,
    AccessoryID INT,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (AccessoryID) REFERENCES Products(ProductID)
);

-- Customers Table: Links to Users with the 'Customer' role
CREATE TABLE Customers (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Transactions Table: Stores customer transactions/orders
CREATE TABLE Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT,
    CustomerName VARCHAR(255),
    StoreID INT,
    ProductID INT,
    OrderID VARCHAR(100),
    PurchaseDate DATETIME,
    ShipDate DATETIME,
    Quantity INT,
    Price DECIMAL(10, 2),
    ShippingCost DECIMAL(10, 2),
    Discount DECIMAL(10, 2),
    TotalSales DECIMAL(10, 2),
    ShippingAddressStreet VARCHAR(255),
    ShippingAddressCity VARCHAR(100),
    ShippingAddressState VARCHAR(50),
    ShippingAddressZipCode VARCHAR(10),
    StoreAddressStreet VARCHAR(255),
    StoreAddressCity VARCHAR(100),
    StoreAddressState VARCHAR(50),
    StoreAddressZipCode VARCHAR(10),
    CreditCardNumber VARCHAR(16),
    Category VARCHAR(100),  -- Added product category
    OrderStatus ENUM('Pending', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (StoreID) REFERENCES Stores(StoreID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Order Updates Table: Tracks updates to orders (Insert/Delete/Update)
CREATE TABLE OrderUpdates (
    UpdateID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID VARCHAR(100),
    TransactionID INT,
    UpdateType ENUM('Insert', 'Delete', 'Update'),
    UpdateDate DATETIME,
    UpdateDetails TEXT,
    FOREIGN KEY (TransactionID) REFERENCES Transactions(TransactionID)
);

-- SalesPersons Table: Links to Users with the 'SalesPerson' role
CREATE TABLE SalesPersons (
    SalesPersonID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    StoreID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (StoreID) REFERENCES Stores(StoreID)
);

-- StoreManagers Table: Links to Users with the 'StoreManager' role
CREATE TABLE StoreManagers (
    ManagerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    StoreID INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (StoreID) REFERENCES Stores(StoreID)
);