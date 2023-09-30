DROP DATABASE IF EXISTS tenants_app;

CREATE DATABASE tenants_app;

USE tenants_app;

CREATE TABLE `tenants` (
    `id` SERIAL PRIMARY KEY,
    `uuid` VARCHAR(255) UNIQUE NOT NULL,
    `db_name` VARCHAR(100) UNIQUE NOT NULL,
    `db_host` VARCHAR(255),
    `db_username` VARCHAR(100),
    `db_password` TEXT,
    `db_port` INTEGER,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW()
);

CREATE TABLE `users` (
    `id` SERIAL PRIMARY KEY,
    `first_name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `user_name` VARCHAR(100) NOT NULL,
    `password` TEXT NOT NULL,
    `locked` BOOLEAN DEFAULT TRUE,
    `tenant_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW()
);

CREATE TABLE `organizations` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `bat_number` VARCHAR(255) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `city` VARCHAR(255) NOT NULL,
    `country` VARCHAR(255) NOT NULL,
    `zipcode` VARCHAR(10) NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP DEFAULT NOW(),
    `updated_at` TIMESTAMP DEFAULT NOW()
);
