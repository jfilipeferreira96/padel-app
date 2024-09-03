-- Criar a tabela 'users'
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    birthdate DATE,
    user_type ENUM('admin', 'player') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar a tabela 'locations'
ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;

INSERT INTO `locations` (`location_id`, `name`, `address`, `city`, `country`,  `href`, `created_at`) VALUES 
(NULL, 'Pro Padel - Mozelos', 'Rua Bairro da Mata, 644, Santa Maria de Lamas', 'Mozelos', 'Portugal', '', current_timestamp()),
(NULL, 'Pro Padel - Lamas', 'Travessa da Salgueirinha, Nº 64, 4535-416 St. M. de Lamas', 'Lamas', 'Portugal',  '',current_timestamp());

-- Criar a tabela 'configs'
CREATE TABLE IF NOT EXISTS configs (
    name VARCHAR(100) NOT NULL,
    href VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `configs` (`name`, `href`, `created_at`) VALUES 
('Torneios', 'https://www.padelteams.pt/info/competition?k=Y2lkPTM3NTY%3D', current_timestamp()),
('Ligas', NULL, current_timestamp());


-- Criar a tabela 'entries'
CREATE TABLE IF NOT EXISTS entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location_id INT NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_by INT,
    validated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Criar a tabela 'admin_locations'
CREATE TABLE IF NOT EXISTS admin_locations (
    admin_location_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    location_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

-- Criar a tabela 'entry_cards'
CREATE TABLE IF NOT EXISTS entry_cards (
    card_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    entry_count INT DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Criar a tabela 'card_entries'
CREATE TABLE IF NOT EXISTS card_entries (
    card_entry_id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    entry_id INT NOT NULL,
    is_special TINYINT(1) DEFAULT 0,
    num_of_entries INT DEFAULT 0,
    FOREIGN KEY (card_id) REFERENCES entry_cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (entry_id) REFERENCES entries(entry_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    stock INT DEFAULT NULL,
    category VARCHAR(50) DEFAULT NULL,
    url_image_1 VARCHAR(255) DEFAULT NULL,
    url_image_2 VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled', 'shipped') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offpeak_cards (
    offpeak_card_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (year, name)
);

CREATE TABLE IF NOT EXISTS user_offpeak_cards (
    user_offpeak_card_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    offpeak_card_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (offpeak_card_id) REFERENCES offpeak_cards(offpeak_card_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT NULL,
    image_path TEXT DEFAULT NULL,
    download_path TEXT DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    user_id INT NOT NULL, 
    date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO offpeak_cards (name, month, year, is_active)
VALUES 
('Cartão Off Peak - Janeiro', 1, 2024, 1),
('Cartão Off Peak - Fevereiro', 2, 2024, 1),
('Cartão Off Peak - Março', 3, 2024, 1),
('Cartão Off Peak - Abril', 4, 2024, 1),
('Cartão Off Peak - Maio', 5, 2024, 1),
('Cartão Off Peak - Junho', 6, 2024, 1),
('Cartão Off Peak - Julho', 7, 2024, 1),
('Cartão Off Peak - Agosto', 8, 2024, 1),
('Cartão Off Peak - Setembro', 9, 2024, 1),
('Cartão Off Peak - Outubro', 10, 2024, 1),
('Cartão Off Peak - Novembro', 11, 2024, 1),
('Cartão Off Peak - Dezembro', 12, 2024, 1),
('Cartão Off Peak - Janeiro', 1, 2025, 1),
('Cartão Off Peak - Fevereiro', 2, 2025, 1),
('Cartão Off Peak - Março', 3, 2025, 1),
('Cartão Off Peak - Abril', 4, 2025, 1),
('Cartão Off Peak - Maio', 5, 2025, 1),
('Cartão Off Peak - Junho', 6, 2025, 1),
('Cartão Off Peak - Julho', 7, 2025, 1),
('Cartão Off Peak - Agosto', 8, 2025, 1),
('Cartão Off Peak - Setembro', 9, 2025, 1),
('Cartão Off Peak - Outubro', 10, 2025, 1),
('Cartão Off Peak - Novembro', 11, 2025, 1),
('Cartão Off Peak - Dezembro', 12, 2025, 1);

ALTER TABLE users 
ADD COLUMN phone VARCHAR(15) DEFAULT NULL UNIQUE;
CREATE UNIQUE INDEX idx_unique_phone ON users(phone);

--------- New:

ALTER TABLE users 
ADD COLUMN reset_password_token VARCHAR(255),
ADD COLUMN reset_password_expires TIMESTAMP;

CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS user_vouchers (
    user_voucher_id INT AUTO_INCREMENT PRIMARY KEY,
    voucher_id INT NOT NULL,
    reason TEXT DEFAULT NULL,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_by INT DEFAULT NULL,
    activated_at TIMESTAMP NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (activated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

INSERT INTO `vouchers` (`voucher_id`, `name`, `created_at`, `image_url`) VALUES (NULL, 'Voucher 1h', current_timestamp(), './vouchers/voucher_1h.png'), (NULL, 'Voucher 1h30', current_timestamp(), './vouchers/voucher_1h30.png'), (NULL, 'Voucher 1 mês - Aulas', current_timestamp(), './vouchers/voucher_aulas.png');

ALTER TABLE users 
ADD COLUMN video_credits INT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS videos_processed (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users_credits_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    credits_before INT NOT NULL,
    credits_after INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Testes:

INSERT INTO users (password, email, user_type, first_name, last_name, birthdate) 
VALUES ('$2b$10$8B9HU4VxyxQhIBEdsl.E9OqrJqxScn8.AuEz4Gc2gP.QDtGbMTCaa', 'admin@mail.com', 'admin', 'admin', 'admin', '1999-01-01');

INSERT INTO admin_locations (admin_id, location_id) VALUES (1,1), (1,2);
