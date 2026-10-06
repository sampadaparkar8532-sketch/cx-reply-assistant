CREATE DATABASE IF NOT EXISTS cx_reply_assistant;
USE cx_reply_assistant;

DROP TABLE IF EXISTS ai_generations;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS knowledge_base_entries;
DROP TABLE IF EXISTS brands;

CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_number VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    status VARCHAR(50),
    delivery_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_type ENUM('customer','agent','ai') NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation_created (conversation_id, created_at)
);

CREATE TABLE knowledge_base_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brand_id INT NOT NULL,
    type ENUM('return','refund','shipping','cancellation','other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
    INDEX idx_kb_brand_type (brand_id, type)
);

CREATE TABLE ai_generations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    customer_message_id INT NULL,
    retrieved_context TEXT,
    ai_response TEXT,
    edited_response TEXT,
    final_response TEXT,
    model VARCHAR(100),
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    status ENUM('generated','edited','approved','failed') DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_ai_conversation_created (conversation_id, created_at)
);

INSERT INTO brands (name) VALUES ('GlowCare'), ('PureHome');

INSERT INTO knowledge_base_entries (brand_id,type,title,content) VALUES
(1,'return','Return Policy','GlowCare accepts returns within 7 days of delivery. Products must be unused and in original packaging.'),
(1,'refund','Refund Policy','GlowCare refunds are processed within 5 business days after return approval.'),
(1,'shipping','Shipping Policy','GlowCare orders are normally delivered within 3 to 5 business days.'),
(1,'cancellation','Cancellation Policy','GlowCare orders can be cancelled before they are shipped.'),

(2,'return','Return Policy','PureHome accepts returns within 14 days of delivery. Products must be unused and in original packaging.'),
(2,'refund','Refund Policy','PureHome refunds are processed within 7 business days after approval.'),
(2,'shipping','Shipping Policy','PureHome orders are normally delivered within 5 to 7 business days.'),
(2,'cancellation','Cancellation Policy','PureHome orders can be cancelled within 2 hours of placing the order.');

INSERT INTO customers (brand_id,name,email) VALUES
(1,'Rahul Sharma','rahul@example.com'),
(2,'Priya Mehta','priya@example.com');

INSERT INTO orders (brand_id,customer_id,order_number,product_name,status,delivery_date) VALUES
(1,1,'GC-10001','Vitamin C Serum','Delivered','2026-10-04'),
(2,2,'PH-20001','Aroma Diffuser','Delivered','2026-10-03');

INSERT INTO conversations (brand_id,customer_id,order_id) VALUES
(1,1,1),
(2,2,2);

INSERT INTO messages (conversation_id,sender_type,content) VALUES
(1,'customer','My order was delivered but the bottle is broken. What can I do?'),
(2,'customer','How long do I have to return this product?');
