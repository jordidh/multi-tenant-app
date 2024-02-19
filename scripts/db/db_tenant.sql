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

