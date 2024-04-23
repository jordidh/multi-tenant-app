CREATE TABLE IF NOT EXISTS `location` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `unit` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `base_unit` INT NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `product` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `version` INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `stock` (
    `id` SERIAL PRIMARY KEY,
    `quantity` INT NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `unit_id` BIGINT UNSIGNED NOT NULL,
    `version` INT NOT NULL DEFAULT 0,
    FOREIGN KEY (location_id) REFERENCES location(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (unit_id) REFERENCES unit(id)
);

CREATE TABLE IF NOT EXISTS `operation_type`(
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(20) NOT NULL,
    `description` VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS `register` (
    `id` SERIAL PRIMARY KEY,
    `initial_stock` JSON NOT NULL,
    `result_stock` JSON NOT NULL,
    `operation_type_id` BIGINT UNSIGNED NOT NULL,
    `date` DATETIME,
    FOREIGN KEY (operation_type_id) REFERENCES operation_type(id)
);

INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova', 1), (2, 'UNIT02' ,'descripcio de prova', 10);
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'), (2, 'PRODUCT02' ,'descripcio de prova');
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); 
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1), (3, 35, 1, 1, 1);
INSERT INTO operation_type (code, name, description) VALUES 
    ('STOCK01', 'createStock', 'insert new stock'),
    ('STOCK02', 'deleteStock', 'delete a stock'),
    ('STOCK03', 'updateStock', 'updates a stock'),
    ('STOCK04', 'fusionStock', 'merge two stocks into one'),
    ('STOCK05', 'divideStock', 'divides a stock into two'),
    ('STOCK06', 'groupStock', 'groups a stock to another with higher base_unit'),
    ('STOCK07', 'ungroupStock', 'ungroups a stock to another with lower base_unit'),
    ('STOCK08', 'changeLocationStock', 'changes the location of the stock'),
    ('STOCK09', 'countLocationStock', 'counts the amount of stock in a location');