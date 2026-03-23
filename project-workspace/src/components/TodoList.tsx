interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: number) => void;
  onDeleteTodo: (id: number) => void;
}

const TodoList = ({ todos, onToggleTodo, onDeleteTodo }: TodoListProps) => {
  return (
    <div className="space-y-3">
      {todos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 text-lg">No tasks yet. Add one above!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li 
              key={todo.id}
              className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center justify-between group ${
                todo.completed ? 'opacity-70' : ''
              }`}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => onToggleTodo(todo.id)}
                  className="h-5 w-5 rounded-full border-gray-300 text-cyan-500 focus:ring-cyan-400 mr-3 cursor-pointer"
                />
                <span
                  className={`text-lg ${todo.completed ? 'line-through text-gray-300' : 'text-white'}`}
                >
                  {todo.text}
                </span>
              </div>
              <button
                onClick={() => onDeleteTodo(todo.id)}
                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TodoList;