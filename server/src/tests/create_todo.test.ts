import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTodoInput = {
  title: 'Test Todo Item'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo Item');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo Item');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].created_at).toBeInstanceOf(Date);
  });

  it('should default completed to false', async () => {
    const result = await createTodo(testInput);

    expect(result.completed).toEqual(false);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].completed).toEqual(false);
  });

  it('should create multiple todos with unique ids', async () => {
    const input1: CreateTodoInput = { title: 'First Todo' };
    const input2: CreateTodoInput = { title: 'Second Todo' };

    const todo1 = await createTodo(input1);
    const todo2 = await createTodo(input2);

    expect(todo1.id).not.toEqual(todo2.id);
    expect(todo1.title).toEqual('First Todo');
    expect(todo2.title).toEqual('Second Todo');

    // Verify both are in database
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(2);
    const titles = allTodos.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
  });

  it('should handle special characters in title', async () => {
    const specialInput: CreateTodoInput = {
      title: 'Todo with "quotes" & <tags> and émojis 🎯'
    };

    const result = await createTodo(specialInput);

    expect(result.title).toEqual('Todo with "quotes" & <tags> and émojis 🎯');

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].title).toEqual('Todo with "quotes" & <tags> and émojis 🎯');
  });
});