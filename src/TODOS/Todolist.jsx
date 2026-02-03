import React from "react";
function TodoList({ todo, toggleTodo, deleteTodo }) {
  return (
    <ul>
        {todo.map((item, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleTodo(index)}
            />
            <span style={{ textDecoration: item.completed ? "line-through" : "none" }}>
              {item.text}
            </span>
            <button onClick={() => deleteTodo(index)}>Delete</button>
          </li>
        ))}
    </ul>  
    );

}
export default TodoList;