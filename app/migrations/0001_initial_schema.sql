-- Initial database schema for Popfizz Community Site
-- SonicJS-compatible tables for content management

-- Posts table for blog articles and community content
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, review, published, archived
    author_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME,
    featured BOOLEAN DEFAULT FALSE,
    tags TEXT -- JSON array as string
);

-- User submissions table for community contributions
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    submitter_name TEXT,
    submitter_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    moderated_by TEXT,
    moderated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submission_type TEXT DEFAULT 'general' -- general, event, resource, etc
);

-- Simple users table for admin authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'author', -- admin, editor, author
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    active BOOLEAN DEFAULT TRUE
);

-- Media files table for R2 storage tracking
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    r2_key TEXT UNIQUE NOT NULL,
    uploaded_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    alt_text TEXT,
    caption TEXT
);

-- Content categories/tags
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (placeholder)
INSERT OR IGNORE INTO users (email, name, role) 
VALUES ('admin@popfizz.win', 'Admin User', 'admin');

-- Insert default categories
INSERT OR IGNORE INTO categories (name, slug, description) VALUES 
('Community', 'community', 'General community posts and discussions'),
('Events', 'events', 'Community events and meetups'),
('Resources', 'resources', 'Helpful resources and guides'),
('Announcements', 'announcements', 'Important community announcements');