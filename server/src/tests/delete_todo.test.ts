import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';

// Test input for deleting a todo
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo successfully', async () => {
    // First, create a todo to delete
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo to Delete',
        completed: false
      })
      .returning()
      .execute();

    const todoToDelete = createResult[0];

    // Delete the todo
    const result = await deleteTodo({ id: todoToDelete.id });

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo is actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoToDelete.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    // Should return false for non-existent todo
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', completed: false },
        { title: 'Todo 2', completed: true },
        { title: 'Todo 3', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one

    // Delete one todo
    const result = await deleteTodo({ id: todoToDelete.id });

    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    
    // Verify the correct todos remain
    const remainingIds = remainingTodos.map(todo => todo.id).sort();
    const expectedIds = [createResults[0].id, createResults[2].id].sort();
    
    expect(remainingIds).toEqual(expectedIds);
  });

  it('should handle deleting completed and incomplete todos', async () => {
    // Create todos with different completion statuses
    const createResults = await db.insert(todosTable)
      .values([
        { title: 'Incomplete Todo', completed: false },
        { title: 'Completed Todo', completed: true }
      ])
      .returning()
      .execute();

    // Delete the completed todo
    const result1 = await deleteTodo({ id: createResults[1].id });
    expect(result1.success).toBe(true);

    // Delete the incomplete todo
    const result2 = await deleteTodo({ id: createResults[0].id });
    expect(result2.success).toBe(true);

    // Verify both todos are deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(0);
  });
});