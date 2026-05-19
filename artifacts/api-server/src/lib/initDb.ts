import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        balance NUMERIC(10,2) NOT NULL DEFAULT 0,
        is_vip BOOLEAN NOT NULL DEFAULT FALSE,
        vip_level INTEGER NOT NULL DEFAULT 0,
        total_recharged NUMERIC(10,2) NOT NULL DEFAULT 0,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        push_token TEXT,
        account_id TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tools (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'عام',
        color TEXT NOT NULL DEFAULT '#7c3aed',
        url TEXT,
        icon_url TEXT,
        image_url TEXT,
        content TEXT,
        content_type TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'عام',
        duration INTEGER NOT NULL DEFAULT 0,
        video_url TEXT,
        image_url TEXT,
        content TEXT,
        content_type TEXT,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'عام',
        price NUMERIC(10,2) NOT NULL DEFAULT 0,
        url TEXT,
        icon_url TEXT,
        image_url TEXT,
        content TEXT,
        content_type TEXT,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT NOT NULL DEFAULT 'info',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        sent_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sent_notifications_log (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT NOT NULL,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        sent_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        title TEXT,
        link_url TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS recharge_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        transfer_image_url TEXT,
        amount NUMERIC(10,2),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        item_title TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    logger.info("Database tables initialized");
  } catch (err) {
    logger.error({ err }, "Failed to initialize database tables");
    throw err;
  } finally {
    client.release();
  }
}
