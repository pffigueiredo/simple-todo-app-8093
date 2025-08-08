import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return single todo when one exists', async () => {
    // Create a test todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Todo');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple todos in correct order', async () => {
    // Create multiple test todos
    await db.insert(todosTable)
      .values([
        { title: 'First Todo', completed: false },
        { title: 'Second Todo', completed: true },
        { title: 'Third Todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are returned
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
    expect(titles).toContain('Third Todo');

    // Verify different completion statuses
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);
    expect(completedTodos).toHaveLength(1);
    expect(incompleteTodos).toHaveLength(2);

    // Verify all required fields are present
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return todos with default completion status', async () => {
    // Create todos without explicitly setting completed status (should default to false)
    await db.insert(todosTable)
      .values([
        { title: 'Default Todo 1' },
        { title: 'Default Todo 2' }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    result.forEach(todo => {
      expect(todo.completed).toEqual(false); // Should default to false
      expect(todo.title).toMatch(/Default Todo \d/);
    });
  });

  it('should return todos with valid timestamps', async () => {
    const beforeInsert = new Date();
    
    await db.insert(todosTable)
      .values({ title: 'Time Test Todo' })
      .execute();
    
    const afterInsert = new Date();
    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].created_at >= beforeInsert).toBe(true);
    expect(result[0].created_at <= afterInsert).toBe(true);
  });
});