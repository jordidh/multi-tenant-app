DROP DATABASE IF EXISTS tenants_app;

CREATE DATABASE tenants_app;

USE tenants_app;

-- Table with all the servers available to create new databases
CREATE TABLE `tenantsdbservers` (
    `id` SERIAL PRIMARY KEY,
    `db_host` VARCHAR(255) UNIQUE NOT NULL,
    `db_port` INTEGER,
    `max_databases` INTEGER,
    `current_databases` INTEGER,
    `locked` BOOLEAN DEFAULT TRUE,
    `priority` INTEGER,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW()
);

INSERT INTO `tenantsdbservers` VALUES
(1, 'localhost', 3306, 100, 0, false, 1, NOW(), NOW()),
(2, '192.168.1.251', 3306, 100, 0, false, 2, NOW(), NOW());

-- Table to store ten	ants and their databases
CREATE TABLE `tenants` (
    `id` SERIAL PRIMARY KEY,
    `uuid` VARCHAR(255) UNIQUE NOT NULL,
    `db_name` VARCHAR(100) UNIQUE NOT NULL,
    `db_host` VARCHAR(255) NOT NULL,
    `db_username` VARCHAR(100),
    `db_password` TEXT,
    `db_port` INTEGER,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW(),
    INDEX uuid_index (`uuid`),
    UNIQUE name_host_index (`db_name`, `db_host`),
    FOREIGN KEY (db_host) REFERENCES tenantsdbservers(db_host)
);

-- Table with the tenant organization
CREATE TABLE `organizations` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) UNIQUE NOT NULL,
    `vat_number` VARCHAR(255) UNIQUE NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `country` VARCHAR(255) NOT NULL,
    `zipcode` VARCHAR(10) NOT NULL,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW(),
    INDEX name_index (`name`),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Table with the tenant users
CREATE TABLE `users`(
    `id` SERIAL PRIMARY KEY,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `user_name` VARCHAR(100) UNIQUE NOT NULL,
    `password` TEXT NOT NULL,
    `password_salt` VARCHAR(100),
    `locked` BOOLEAN DEFAULT TRUE,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW(),
    INDEX email_index (`email`),
    INDEX user_name_index (`user_name`),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Table with activation/invitation user codes
-- Teh activation link can be made with the activation code and other information
CREATE TABLE `activationcodes` (
    `id` SERIAL PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `activation_code` VARCHAR(255) NOT NULL,
    `valid` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW(),
    INDEX activation_code_index (`activation_code`),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CREATE TABLE `tokenblocklist` (
--     `token` VARCHAR(255) NOT NULL UNIQUE,
--     `expiration_date` TIMESTAMP DEFAULT NOW()
-- );

-- this table must be in every tenant
-- CREATE TABLE `refreshToken` (
--     `token` VARCHAR(255) NOT NULL UNIQUE,
--     `expiration_date` TIMESTAMP DEFAULT NOW()
-- );

INSERT INTO tenants (uuid, db_name, db_host, db_username, db_password, db_port, created_at, updated_at) 
VALUES 
('tenant1-uuid', 'db_tenant1', 'localhost', 'user_tenant1', 'password_tenant1', 3306, NOW(), NOW()),
('tenant2-uuid', 'db_tenant2', 'localhost', 'user_tenant2', 'password_tenant2', 3306, NOW(), NOW()),
('tenant3-uuid', 'db_tenant3', 'localhost', 'user_tenant3', 'password_tenant3', 3306, NOW(), NOW());