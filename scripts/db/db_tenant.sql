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

-- Insert data into the unit table
INSERT INTO `unit` (`id`, `code`, `description`, `base_unit`) VALUES 
(1, 'UNIT01', 'test description', 1), 
(2, 'UNIT02', 'test description', 10);

-- Insert data into the product table
INSERT INTO `product` (`id`, `code`, `description`) VALUES 
(1, 'PRODUCT01', 'test description'), 
(123, 'PRODUCT0123', 'test description'),
(124, 'PRODUCT0124', 'test description'),
(2, 'PRODUCT02', 'test description');

-- Insert data into the location table
INSERT INTO `location` (`id`, `code`, `description`) VALUES 
(1, 'UBIC01', 'description 1'), 
(2, 'UBIC02', 'description 2'); 

-- Insert data into the stock table
INSERT INTO `stock` (`id`, `quantity`, `location_id`, `product_id`, `unit_id`) VALUES 
(1, 55, 1, 1, 1), 
(2, 17, 2, 1, 1), 
(3, 35, 1, 1, 1);

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

-- Insert data into the address table
INSERT INTO `address` (`id`, `street`, `city`, `state`, `zip`, `country`) VALUES 
(1, '123 Main St', 'Anytown', 'Anystate', '12345', 'Country1'),
(2, '456 Main St', 'Anytown', 'Anystate', '12345', 'Country1'),
(3, '765 Main St', 'Anytown', 'Anystate', '12345', 'Country1');

-- Insert data into the customer table
INSERT INTO `customer` (`id`, `name`, `address_id`, `email`, `phone`) VALUES 
(1, 'Customer1', 1, 'customer1@gmail.com', '123456789'),
(2, 'Customer2', 2, 'customer2@gmail.com', '987654321'),
(3, 'Customer3', 3, 'customer3@gmail.com', '971217890');

-- Insert data into the provider table
INSERT INTO `provider` (`id`, `name`, `address_id`, `email`, `contact`) VALUES 
(1, 'Provider1', 1, 'provider1@example.com', '123456789'),
(2, 'Provider2', 2, 'provider2@example.com', '987654321'),
(3, 'Provider3', 3, 'provider3@example.com', '198543789');

-- Insert data into the place table
INSERT INTO `place` (`id`, `name`, `location`) VALUES 
(1, 'Warehouse1', 'Location1'),
(2, 'Warehouse2', 'Location2'),
(3, 'Warehouse3', 'Location3');

INSERT INTO `order` (id, order_type, customer_id, provider_id, order_date, due_date, status, warehouse_id_source, warehouse_id_destination, notes) VALUES 
(1, 'Type1', 1, 1, '2024-06-01 10:00:00', '2024-06-15 10:00:00', 'Pending', 1, 2, 'Notes for order 1'),
(2, 'Type2', 2, 2, '2024-06-05 12:00:00', '2024-06-20 12:00:00', 'Completed', 2, 1, 'Notes for order 2'),
(3, 'Type1', 3, 3, '2023-06-01 10:00:00', '2023-06-15 10:00:00', 'Pending', 1, 2, 'Notes for order 3');

INSERT INTO order_line (id, order_id, product_id, quantity, unit_id, price) VALUES 
(1, 1, 1, 10, 1, 9.99), 
(2, 1, 2, 20, 2, 19.99), 
(3, 2, 1, 15, 1, 14.99);
