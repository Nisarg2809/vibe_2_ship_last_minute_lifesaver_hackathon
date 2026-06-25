import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], tasks: [], slots: [], reminders: [] };
  }
}

async function writeDb(data) {
  const tempPath = `${dbPath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tempPath, dbPath);
}

export const db = {
  async getTable(table) {
    const data = await readDb();
    return data[table] || [];
  },

  async find(table, queryFn) {
    const list = await this.getTable(table);
    if (!queryFn) return list;
    return list.filter(queryFn);
  },

  async findOne(table, queryFn) {
    const list = await this.getTable(table);
    return list.find(queryFn) || null;
  },

  async insert(table, record) {
    const data = await readDb();
    if (!data[table]) data[table] = [];
    
    if (!record.id) {
      record.id = Math.random().toString(36).substring(2, 11);
    }
    
    data[table].push(record);
    await writeDb(data);
    return record;
  },

  async update(table, queryFn, updates) {
    const data = await readDb();
    if (!data[table]) return [];
    
    const updatedRecords = [];
    data[table] = data[table].map(record => {
      if (queryFn(record)) {
        const updated = { ...record, ...updates };
        updatedRecords.push(updated);
        return updated;
      }
      return record;
    });
    
    await writeDb(data);
    return updatedRecords;
  },

  async delete(table, queryFn) {
    const data = await readDb();
    if (!data[table]) return false;
    
    const initialLen = data[table].length;
    data[table] = data[table].filter(record => !queryFn(record));
    const deleted = data[table].length < initialLen;
    if (deleted) {
      await writeDb(data);
    }
    return deleted;
  }
};
