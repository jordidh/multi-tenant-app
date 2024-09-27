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




