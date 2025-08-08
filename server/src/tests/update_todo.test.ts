import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper to create a test todo
const createTestTodo = async (title: string = 'Test Todo'): Promise<number> => {
  const result = await db.insert(todosTable)
    .values({
      title,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Complete this task');

    const input: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(input);

    // Verify the returned todo
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Complete this task');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status to false', async () => {
    // Create a completed test todo
    const todoId = await createTestTodo('Already completed task');
    
    // First mark it as completed
    await db.update(todosTable)
      .set({ completed: true })
      .where(eq(todosTable.id, todoId))
      .execute();

    const input: UpdateTodoInput = {
      id: todoId,
      completed: false
    };

    const result = await updateTodo(input);

    // Verify the completion status was changed to false
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Already completed task');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the update in the database', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Task to verify persistence');

    const input: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    await updateTodo(input);

    // Query the database directly to verify the update was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].id).toEqual(todoId);
    expect(todos[0].title).toEqual('Task to verify persistence');
    expect(todos[0].completed).toBe(true);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const input: UpdateTodoInput = {
      id: 99999, // Non-existent ID
      completed: true
    };

    await expect(updateTodo(input)).rejects.toThrow(/todo with id 99999 not found/i);
  });

  it('should not modify title or created_at when updating completion status', async () => {
    // Create a test todo and get its original data
    const todoId = await createTestTodo('Original title');
    
    const originalTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    const originalCreatedAt = originalTodo[0].created_at;

    const input: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(input);

    // Verify only completion status changed
    expect(result.title).toEqual('Original title');
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.completed).toBe(true);
  });

  it('should handle multiple updates on the same todo', async () => {
    // Create a test todo
    const todoId = await createTestTodo('Toggle task');

    // Update to completed
    const firstUpdate: UpdateTodoInput = {
      id: todoId,
      completed: true
    };
    
    const firstResult = await updateTodo(firstUpdate);
    expect(firstResult.completed).toBe(true);

    // Update back to incomplete
    const secondUpdate: UpdateTodoInput = {
      id: todoId,
      completed: false
    };
    
    const secondResult = await updateTodo(secondUpdate);
    expect(secondResult.completed).toBe(false);
    expect(secondResult.id).toEqual(todoId);
    expect(secondResult.title).toEqual('Toggle task');
  });
});