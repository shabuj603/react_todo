import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";


function Todo() {  
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [todo, setTodo] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [input, setInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [draggingId, setDraggingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

   // ==============================
  // Dummy Users
  // ==============================
  const users = {
    "john.doe@example.com":{
      password: 'password123',
      todo: []
    },
    "test@gmail.com":{
      password: 'testpass', todo: []
    }
  }

  // ==============================
  // Add Todo
  // ==============================
  const addTodo = () => {
    if(input.trim() === "" || !dueDate) return;
    setTodo([...todo, {id: Date.now(), text: input, completed: false, isEditing: false, priority, dueDate}]);
    setInput("");
    setDueDate("");
    setPriority("medium");
  };

    
   // ==============================
  // Handle Login
  // ==============================

  const handleLogin = () =>{
    const users = JSON.parse(localStorage.getItem("users")) || {};
    if(!users[email]){
      alert("User not found!");
      return;
    }
    if(users[email].password !== password){
      alert("Incorrect password!");
      return;
    }
    setUser(email);
    setTodo(users[email].todo || []);
    localStorage.setItem("currentUser", email);    
  }
  useEffect(() => {
      if(!user) return;
      const users = JSON.parse(localStorage.getItem("users")) || {};
      users[user] = { password: users[user]?.password || password, todo };
      localStorage.setItem("users", JSON.stringify(users)); 
    }, [todo, user]);


    const handleRegistration = () =>{
    const users = JSON.parse(localStorage.getItem("users")) || {};
    if(users[email]){
      alert("User already exists!");
      return;
    }
    users[email] = { password, todo: [] };
    localStorage.setItem("users", JSON.stringify(users));
    setUser(email);
    setTodo(users[email].todo || []);
    localStorage.setItem("currentUser", email);

  }
    


  // ==============================
  // Excel Export
  // ==============================
  const exportToExcel = () => {
    const todoData = todo.map(({ id, text, completed, priority, dueDate }) => ({
      ID: id,
      Text: text,
      Completed: completed ? "Yes" : "No",
      Priority: priority,
      DueDate: dueDate,
    }));
    const worksheet = XLSX.utils.json_to_sheet(todoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Todos");
    XLSX.writeFile(workbook, "todos.xlsx");
  };

  // ==============================
  // Excel Import
  // ==============================
  const importToExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const importedData = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = importedData.map((item) => ({
        id: item.ID,
        text: item.Text || "",
        completed: item.Completed === "Yes",
        priority: item.Priority || "medium",
        dueDate: item.DueDate || "",
      }));
      setTodo(prev => [...prev, ...formattedData]);
    };
    reader.readAsArrayBuffer(file); // safer than readAsBinaryString
  };

  // ==============================
  // JSON Export
  // ==============================
  const exportToJSON = () => {
    const dataStr = JSON.stringify(todo, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "todos.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==============================
  // Drag & Drop
  // ==============================
  const handleDragStart = (id) => setDraggingId(id);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (dropId) => {
    if (draggingId === null) return;
    const updatedTodos = [...todo];
    const dragIndex = updatedTodos.findIndex(item => item.id === draggingId);
    const dropIndex = updatedTodos.findIndex(item => item.id === dropId);
    if(dragIndex === -1 || dropIndex === -1) return;
    const [draggedItem] = updatedTodos.splice(dragIndex, 1);
    updatedTodos.splice(dropIndex, 0, draggedItem);
    setTodo(updatedTodos);
    setDraggingId(null);
  };

  

  // ==============================
  // Dark Mode Persistence
  // ==============================
  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    if (savedMode === "dark") setDarkMode(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ==============================
  // Load/Save Todos in localStorage
  // ==============================
  useEffect(() => {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) setTodo(JSON.parse(storedTodos));   
  }, []);
  useEffect(() => {
    if (user) {
      users[user].todo = todo;
      localStorage.setItem("users", JSON.stringify(users));
    }
  }, [todo, user]);

  // ==============================
  // Toggle Todo
  // ==============================
  const toggleTodo = (id) => {
    setTodo(todo.map(item => item.id === id ? {...item, completed: !item.completed} : item));
  };

  // ==============================
  // Notification Permission
  // ==============================
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") console.log("Notification permission granted.");
      });
    }
  }, []);

  // ==============================
  // Check Due Dates for Notification
  // ==============================
  useEffect(() => {
    if("Notification" in window && Notification.permission === "granted"){ 
      checkDueDates();
      const interval = setInterval(checkDueDates, 24 * 60 * 60 * 1000); // দৈনিক চেক
      return () => clearInterval(interval);
    }
  }, [todo]);

  const checkDueDates = () => {
    const today = new Date().toISOString().split('T')[0];
    todo.forEach(item => {
      if (item.dueDate === today && !item.notified) {
        new Notification("Todo Due Today!", { body: `Your task "${item.text}" is due today.` });
        setTodo(prev => prev.map(todoItem => todoItem.id === item.id ? {...todoItem, notified: true} : todoItem));
      }
    });
  };

  // ==============================
  // Edit / Save / Delete Todo
  // ==============================
  const editTodo = (id) => {
    setTodo(todo.map(item => item.id === id ? {...item, isEditing: true} : item));    
  };
 const saveTodos = async (e) => {
    e.preventDefault();

    // চেক করুন ডাটা আছে কি না
    if (todo.length === 0) {
        alert("No todos to save!");
        return;
    }

    try {
        
        const response = await axios.post('http://127.0.0.1:8000/api/todos', {
            todos: todo 
           
        });

        if (response.status === 201 || response.status === 200) {
            alert("All todos saved to database!");
            
        }
    } catch (error) {
        console.error("Error saving todos:", error);
        alert("Error saving todos. Check Console.");
    }
};
  const saveTodo = (id, newText) => {
    if(newText.trim() === "") return;
    setTodo(todo.map(item => item.id === id ? {...item, text: newText, isEditing: false} : item));
  };
  const deleteTodo = (id) => setTodo(todo.filter(item => item.id !== id));

  // ==============================
  // Filter & Search
  // ==============================
  const filteredTodos = todo.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "completed" && item.completed) || (filter === "incomplete" && !item.completed);
    return matchesSearch && matchesFilter;
  });

  const clearCompleted = () => setTodo(todo.filter(item => !item.completed));

  const priorityColor = (priority) => {
    if(priority === "high") return "border-red-500 bg-red-50";
    if(priority === "medium") return "border-yellow-500 bg-yellow-50";
    return "border-green-500 bg-green-50";
  };

  const getDateStatus = (date) => {
    const today = new Date().toISOString().split('T')[0];
    if(date < today) return "overdue";
    if(date === today) return "due-today";
    return "upcoming";
  }

  // ==============================
  // JSX
  // ==============================
  return (
    <div className={darkMode ? "min-h-screen w-full bg-gray-900 text-white flex items-center justify-center p-4" : "min-h-screen bg-gray-100 text-black flex items-center justify-center p-4"}>
      {!user ? (
        <div className={darkMode ? "w-screen max-w-md p-6 bg-gray-800 rounded-xl shadow-lg" : "w-screen max-w-md p-6 bg-white rounded-xl shadow-lg"}>
          <h2 className='mb-4 text-center text-2xl font-bold text-blue-600'>Login / Register</h2>
          <input className='w-full mb-3 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition'
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input className='w-full mb-3 border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition'
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <div className='flex gap-2 justify-center'>
            <button className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition' onClick={handleLogin}>Login</button>
            <button className='bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 active:scale-95 transition' onClick={handleRegistration}>Register</button>
          </div>
        </div>
      ) : (
        <div className="absolute top-4 right-4">
          こんにちは, {user}!
          <button className='bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 active:scale-95 transition' onClick={() => { setUser(null); localStorage.removeItem("currentUser"); }}>Logout</button>
        </div>
      )}    
      <div className={darkMode ? "w-screen max-w-lg p-6 bg-gray-800 rounded-xl shadow-lg" : "w-4xl max-w-4xl p-6 bg-white rounded-xl shadow-lg"}>
        
        <h1 className='mb-4 text-center text-2xl font-bold text-blue-600'>Todo App</h1>

        {/* Dark Mode */}
        <div className="mb-4">
          <button className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 active:scale-95 transition" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>

        {/* Add Todo */}
        <div className='flex gap-2 mb-4'>
          <form  onSubmit={saveTodos}>
            <input className='flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition'
            type="text" 
            placeholder="Enter your task" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
          />
          <input className='border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition'
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
          />
          <select className='border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition' value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button className='bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 active:scale-95 transition' type='submit' onClick={addTodo}>Add Todo</button>
          <button 
            className='w-full mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition' 
            onClick={saveTodos}>
            Save All to Database
          </button>
          </form>
          
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search todo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-3 border p-2 rounded-lg focus:ring-2 focus:ring-blue-400"
        />

        {/* Export Buttons */}
        <div className='flex gap-2 mb-4'>
          <button className='bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 active:scale-95 transition' onClick={exportToExcel}>Export Excel</button>
          <button className='bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 active:scale-95 transition' onClick={exportToJSON}>Export JSON</button>

          {/* Import Excel */}
          <input type="file" accept=".xlsx,.xls" onChange={importToExcel} className='bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 active:scale-95 transition'/>
        </div>

        {/* Filters */}
        <div className='flex justify-center gap-2 mb-4'>
          <button className={`px-4 py-2 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100"}`} onClick={()=> setFilter("all")}>All</button>
          <button className={`px-4 py-2 rounded ${filter === "completed" ? "bg-blue-600 text-white" : "bg-gray-100"}`} onClick={()=> setFilter("completed")}>Completed</button>
          <button className={`px-4 py-2 rounded ${filter === "incomplete" ? "bg-blue-600 text-white" : "bg-gray-100"}`} onClick={()=> setFilter("incomplete")}>Incomplete</button>
          <button className={`px-4 py-2 rounded bg-gray-100 text-black hover:bg-blue-600 text-white`} onClick={clearCompleted}>Clear Completed</button>
        </div>

        {/* Todo List */}
        <ul className='space-y-2 max-w-md mx-auto mt-4'>
          {filteredTodos.map(item => (
            <li key={item.id} draggable onDragStart={() => handleDragStart(item.id)} onDragOver={handleDragOver} onDrop={() => handleDrop(item.id)}
              className={`flex justify-between items-center p-2 border rounded cursor-move ${priorityColor(item.priority)}`}>

              {item.isEditing ? (
                <input className="flex-1 border p-1 mr-2 rounded" defaultValue={item.text} 
                onBlur={(e)=> saveTodo(item.id, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveTodo(item.id, e.target.value)}}/>
              ) : (
                <span className={item.completed ? "line-through text-gray-400" : ""} onClick={() => toggleTodo(item.id)}>
                  {item.text} <span className="ml-2 text-xs font-semibold">Priority: {item.priority.toUpperCase()}</span>
                </span>
              )}

              <p className={getDateStatus(item.dueDate) === 'overdue' ? 'text-red-500' : getDateStatus(item.dueDate) === 'due-today' ? 'text-yellow-500' : 'text-green-500'}>
                {item.dueDate}
              </p>

              <div className="flex gap-2">
                {item.isEditing ? (
                  <button className="bg-green-500 text-white px-2 rounded" >Editing..</button>
                 
                ) : (
                  <button className="bg-yellow-400 px-2 rounded" onClick={() => editTodo(item.id)}>Edit</button>
                )}
                <button className="bg-red-500 text-white px-2 rounded" onClick={() => deleteTodo(item.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>

        {/* Counter */}
        <div className='mt-6 flex justify-center gap-2'>
          <button className='bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white' onClick={()=> setCount(count +1)}>Increase</button>
          <span className='px-4 py-2 font-bold text-xl'>Count: {count}</span>
          <button className='bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white' onClick={()=> setCount(count -1)}>Decrease</button>
        </div>
      </div>
    </div>
  );
}

export default Todo;
