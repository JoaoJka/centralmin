import { get, push, ref, remove, set, update } from 'firebase/database';
import { db } from './firebase';

export type EntityId = string | number;
export type EntityRecord = Record<string, unknown> & {
  id?: EntityId | undefined;
  fbKey?: string | undefined;
};

const normalizeId = (id: EntityId) => String(id);

export class RealtimeRepository<T extends EntityRecord> {
  constructor(private readonly path: string) {}

  async list(): Promise<T[]> {
    const snapshot = await get(ref(db, this.path));
    const value = snapshot.val() as Record<string, T> | null;

    if (!value) return [];

    return Object.entries(value).map(([fbKey, data]) => ({
      ...data,
      fbKey,
    }));
  }

  async findById(id: EntityId): Promise<(T & { fbKey: string }) | null> {
    const items = await this.list();
    const item = items.find(
      current => normalizeId(current.id ?? current.fbKey ?? '') === normalizeId(id)
    );

    if (!item?.fbKey) return null;
    return item as T & { fbKey: string };
  }

  async create(data: T): Promise<T> {
    const newRef = push(ref(db, this.path));
    const id = data.id ?? newRef.key;
    const payload = {
      ...data,
      id,
    } as T;

    await set(newRef, payload);
    const created = {
      ...payload,
    } as T;

    if (newRef.key) {
      created.fbKey = newRef.key;
    }

    return created;
  }

  async updateById(id: EntityId, data: Record<string, unknown>): Promise<T | null> {
    const item = await this.findById(id);
    if (!item) return null;

    await update(ref(db, `${this.path}/${item.fbKey}`), data);
    const updated = await this.findById(id);
    return updated;
  }

  async deleteById(id: EntityId): Promise<boolean> {
    const item = await this.findById(id);
    if (!item) return false;

    await remove(ref(db, `${this.path}/${item.fbKey}`));
    return true;
  }

  async nextNumericId(): Promise<number> {
    const items = await this.list();
    const ids = items
      .map(item => Number(item.id))
      .filter(id => Number.isInteger(id) && id > 0);

    return ids.length ? Math.max(...ids) + 1 : 1;
  }
}

export const configRepository = {
  async get<T extends EntityRecord>(): Promise<T | null> {
    const snapshot = await get(ref(db, 'config/main'));
    return snapshot.val() as T | null;
  },

  async update<T extends EntityRecord>(data: Record<string, unknown>): Promise<T> {
    await update(ref(db, 'config/main'), data);
    const snapshot = await get(ref(db, 'config/main'));
    return (snapshot.val() ?? {}) as T;
  },
};
