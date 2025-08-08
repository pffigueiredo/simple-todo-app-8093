import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTodoInput } from '../schema';

export async function deleteTodo(input: DeleteTodoInput): Promise<{ success: boolean }> {
  try {
    // Delete the todo by ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    // Check if a record was actually deleted
    const success = result.rowCount !== null && result.rowCount !== undefined && result.rowCount > 0;

    return { success };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
}