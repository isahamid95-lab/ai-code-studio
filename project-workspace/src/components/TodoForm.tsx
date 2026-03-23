import { useState } from 'react';

interface TodoFormProps {
  onAddTodo: (text: string) => void;
}

const TodoForm = ({ onAddTodo }: TodoFormProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddTodo(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a new task..."
        className="flex-grow bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
      >
        Add
      </button>
    </form>
  );
};

export default TodoForm;