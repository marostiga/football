import { Pool } from 'pg';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playersFile = path.join(__dirname, 'data', 'players.json');
const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'football'}`;

const pool = new Pool({ connectionString });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id integer PRIMARY KEY,
      name text NOT NULL,
      position text NOT NULL,
      velocidade integer NOT NULL,
      drible integer NOT NULL,
      finalizacao integer NOT NULL,
      passe integer NOT NULL,
      defesa integer NOT NULL
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*) FROM players;');
  const count = Number(rows[0]?.count || 0);

  if (count === 0) {
    const fileContent = await readFile(playersFile, 'utf-8');
    const players = JSON.parse(fileContent);

    for (const player of players) {
      await pool.query(
        `INSERT INTO players (id, name, position, velocidade, drible, finalizacao, passe, defesa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING;`,
        [
          player.id,
          player.name,
          player.position,
          player.velocidade,
          player.drible,
          player.finalizacao,
          player.passe,
          player.defesa,
        ]
      );
    }
  }
}

export async function getPlayers() {
  const result = await pool.query('SELECT * FROM players ORDER BY id;');
  return result.rows;
}

export async function getPlayersByIds(ids) {
  if (!ids || ids.length === 0) {
    return [];
  }

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  const result = await pool.query(
    `SELECT * FROM players WHERE id IN (${placeholders}) ORDER BY id;`,
    ids
  );
  return result.rows;
}

export async function updatePlayer(id, attributes) {
  const { position, velocidade, drible, finalizacao, passe, defesa } = attributes;
  const result = await pool.query(
    `UPDATE players
     SET position = $2,
         velocidade = $3,
         drible = $4,
         finalizacao = $5,
         passe = $6,
         defesa = $7
     WHERE id = $1
     RETURNING *;`,
    [id, position, velocidade, drible, finalizacao, passe, defesa]
  );
  return result.rows[0];
}
