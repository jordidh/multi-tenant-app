CREATE TABLE IF NOT EXISTS `location` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `unit` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `base_unit` INT NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `product` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `stock` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quantity` INT NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `unit_id` BIGINT UNSIGNED NOT NULL,
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`location_id`) REFERENCES `location`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `operation_type` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `description` VARCHAR(255),
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `register` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `initial_stock` JSON NOT NULL COMMENT 'Initial stock details in JSON format',
    `result_stock` JSON NOT NULL COMMENT 'Result stock details in JSON format',
    `operation_type_id` BIGINT UNSIGNED,
    `date` DATETIME,
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`operation_type_id`) REFERENCES `operation_type`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Stores stock change details in JSON format';

CREATE TABLE IF NOT EXISTS `address` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `street` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `zip` VARCHAR(20) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
) COMMENT 'Stores addresses details';

CREATE TABLE IF NOT EXISTS `customer` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `address_id` BIGINT UNSIGNED NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(255),
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`address_id`) REFERENCES `address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores customer details';

CREATE TABLE IF NOT EXISTS `provider` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `address_id` BIGINT UNSIGNED NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `contact` VARCHAR(255),
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`address_id`) REFERENCES `address`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores provider details';

CREATE TABLE IF NOT EXISTS `place` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
) COMMENT 'Stores place details';

CREATE TABLE IF NOT EXISTS `order` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_type` VARCHAR(50) NOT NULL,
    `customer_id` BIGINT UNSIGNED,
    `provider_id` BIGINT UNSIGNED,
    `order_date` DATETIME NOT NULL,
    `due_date` DATETIME NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `warehouse_id_source` BIGINT UNSIGNED,
    `warehouse_id_destination` BIGINT UNSIGNED,
    `notes` TEXT,
    `comments` TEXT,
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`provider_id`) REFERENCES `provider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`warehouse_id_source`) REFERENCES `place`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`warehouse_id_destination`) REFERENCES `place`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) COMMENT 'Stores order details';

CREATE TABLE IF NOT EXISTS `order_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT NOT NULL,
    `unit_id` BIGINT UNSIGNED NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`unit_id`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) COMMENT 'Stores order line items';


-- Insert data into the operation_type table
INSERT INTO `operation_type` (`code`, `name`, `description`) VALUES 
('STOCK01', 'createStock', 'insert new stock'),
('STOCK02', 'deleteStock', 'delete a stock'),
('STOCK03', 'updateStock', 'updates a stock'),
('STOCK04', 'fusionStock', 'merge two stocks into one'),
('STOCK05', 'divideStock', 'divides a stock into two'),
('STOCK06', 'groupStock', 'groups a stock to another with higher base_unit'),
('STOCK07', 'ungroupStock', 'ungroups a stock to another with lower base_unit'),
('STOCK08', 'changeLocationStock', 'changes the location of the stock'),
('STOCK09', 'countLocationStock', 'counts the amount of stock in a location');

