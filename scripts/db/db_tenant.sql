CREATE TABLE IF NOT EXISTS `location` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `unit` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `base_unit` INT NOT NULL
);

CREATE TABLE IF NOT EXISTS `product` (
    `id` SERIAL PRIMARY KEY,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `stock` (
    `id` SERIAL PRIMARY KEY,
    `quantity` INT NOT NULL,
    `location_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `unit_id` BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (location_id) REFERENCES location(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (unit_id) REFERENCES unit(id)
);