import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, CheckCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load todos on component mount
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create new todo
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      setIsCreating(true);
      const createInput: CreateTodoInput = { title: newTodoTitle.trim() };
      const newTodo = await trpc.createTodo.mutate(createInput);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle todo completion
  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? { ...t, completed: updatedTodo.completed } : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <CheckCircle className="w-10 h-10 text-blue-600" />
            Todo App
          </h1>
          <p className="text-gray-600">Stay organized and get things done! ✨</p>
        </div>

        {/* Add Todo Form */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a new todo... 📝"
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTodoTitle(e.target.value)}
                className="flex-1 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                disabled={isCreating}
              />
              <Button 
                type="submit" 
                disabled={isCreating || !newTodoTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        {totalCount > 0 && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  Progress: <span className="font-semibold">{completedCount} of {totalCount}</span> completed
                </span>
                <div className="text-2xl">
                  {completedCount === totalCount && totalCount > 0 ? '🎉' : '📊'}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
              📋 Your Tasks
              {totalCount > 0 && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {totalCount}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500">Loading your todos...</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg mb-2">No todos yet!</p>
                <p className="text-gray-400">Add your first task above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todos.map((todo: Todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                      todo.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm transition-all duration-200 ${
                          todo.completed
                            ? 'line-through text-green-700'
                            : 'text-gray-800'
                        }`}
                      >
                        {todo.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {todo.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          Stay productive! 💪
        </div>
      </div>
    </div>
  );
}

export default App;