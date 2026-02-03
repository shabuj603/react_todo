import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TodosTable = () => {
    const API_URL = "http://127.0.0.1:8000/api/todos";

    const [bdTodos, setBdTodos] = useState([]);
    const [ismodalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [currentTodo, setCurrentTodo] = useState({id: null, title: "", priority: "", due_date: "", completed: false});
    const [viewTodo, setViewTodo] = useState(null);
  
    useEffect(() => {
        fetchTodos();
    }, []);
//===============================
//fetch todos from database
//===============================
    const fetchTodos = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setBdTodos(data);
            console.log("Fetched Todos:", data);
        } catch (error) {
            console.error("Error fetching todos:", error);
        }
    };

  // ==============================
  // Excel Export
  // ==============================
  const exportToExcel = () => {
    const todoData = bdTodos.map(({ id, title, completed, priority, due_date }) => ({
      ID: id,
      Title: title,
      Completed: completed ? "Yes" : "No",
      Priority: priority,
      DueDate: due_date,
    }));
    const worksheet = XLSX.utils.json_to_sheet(todoData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Todos");
    XLSX.writeFile(workbook, "todos.xlsx");
  };

  
    //===============================
    //download todo list as PDF
    //===============================

    const downloadPDF = () => {
    const doc = new jsPDF();
  

    // পিডিএফ এর টাইটেল
    doc.setFontSize(18);
    doc.text("Todo List Report", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // টেবিলের ডাটা ফরম্যাট করা
    const tableRows = bdTodos.map(todo => [
        todo.id,
        todo.title,
        todo.priority.toUpperCase(),
        todo.due_date || 'N/A',
        todo.completed ? "Completed" : "Pending"
    ]);

    // টেবিল তৈরি করা
    autoTable(doc, {
        startY: 35,
        head: [['ID', 'Task Title', 'Priority', 'Due Date', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillGray: [41, 128, 185], textColor: 255 },
    });

    // পিডিএফটি নতুন ট্যাবে ওপেন হবে (ভিউ করার জন্য)
    window.open(doc.output('bloburl'), '_blank');
    
    // অথবা সরাসরি ডাউনলোড করতে চাইলে:
    // doc.save("todo-report.pdf");
};

//===============================
//download single todo as PDF
//===============================
const downloadSinglePDF = (todo) => {
    const doc = new jsPDF();

    // হেডার স্টাইল
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185);
    doc.text("Task Detail Report", 14, 20);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, 196, 25); // একটি ডিভাইডার লাইন

    // ডাটা টেবিল আকারে সাজানো
    const details = [
        ["Field", "Details"],
        ["Task ID", `#${todo.id}`],
        ["Title", todo.title],
        ["Priority", todo.priority.toUpperCase()],
        ["Due Date", todo.due_date || "Not Set"],
        ["Status", todo.completed ? "Completed" : "Pending"],
        ["Generated On", new Date().toLocaleString()]
    ];

    autoTable(doc, {
        startY: 30,
        head: [details[0]],
        body: details.slice(1),
        theme: 'striped',
        headStyles: { fillGray: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 12, cellPadding: 5 }
    });

    doc.save(`Task_${todo.id}_Details.pdf`);
};

    //===============================
    //open modal to edit todo
    //===============================
    const openModal = (todo) => {
        setCurrentTodo(todo);
        setIsModalOpen(true);
    };

    const handleUpdate = async(todo) => {

        try {
            const response = await fetch(`${API_URL}/${todo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: currentTodo.title, priority: currentTodo.priority, due_date: currentTodo.due_date, completed: currentTodo.completed }),
            });
            if(response.ok) {
                setBdTodos(prevTodos => prevTodos.map(t => (t.id === currentTodo.id ? {...t, ...currentTodo} : t)));
                setIsModalOpen(false);
                alert("Todo status updated successfully.");
            }
        } catch (error) {
            alert("Failed to update todo status: " + error.message);
        }
    };
//===============================
//delete todo from database
//===============================
    const handleDelete = async(id) => {
        if(!window.confirm("Are you sure you want to delete this todo?")) {
           try {
         const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        })
        if(response.ok){
              setBdTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        }
        fetchTodos(); // Refresh the todos list after deletion
       } catch (error) {
            alert("Failed to delete the todo: " + error.message);
        }
        }
       
    };

    
    return (
        <div className="bg-white p-5 rounded-xl shadow pt-5 mt-6">
            <div className="flex justify-between item-center mb-4">

            <h2 className="text-xl font-semibold mb-4">Todos Table</h2>               
                <div className='flex gap-2 mb-4'>
                     <button 
                    onClick={() => setIsPreviewOpen(true)} 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow"
                    >
                    Preview PDF
                    </button>
                    <button className='bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 active:scale-95 transition' onClick={exportToExcel}>Export Excel</button>
                 </div>
            </div>
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">ID</th>
                        <th className="py-2 px-4 border-b">Title</th>
                        <th className="py-2 px-4 border-b">Priority</th>
                        <th className="py-2 px-4 border-b text-left">Due Date</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {bdTodos.length === 0 && (
                        <tr>
                            <td colSpan="6" className="py-4 px-4 text-center text-gray-500">No todos available.</td>
                        </tr>
                    )}
                    {bdTodos.map(todo => (
                        <tr key={todo.id} className="hover:bg-gray-100">
                            <td className="py-2 px-4 border-b">{todo.id}</td>
                            <td className={`py-2 px-4 border-b ${todo.completed ? 'line-through text-gray-500' : ''}`}>{todo.title}</td>
                            <td className="py-2 px-4 border-b">{todo.priority}</td>
                            <td className="py-2 px-4 border-b">{todo.due_date}</td>
                            <td className={`py-2 px-4 border-b ${todo.completed === 'Completed' ? 'text-green-500' : 'text-red-500'}`}>{todo.completed ? 'Completed' : 'Pending'}</td>
                            <td className="py-2 px-4 border-b">
                                <button onClick={() => openModal(todo)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition">Edit</button> 
                                <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition ml-2" onClick={() => handleDelete(todo.id)}>Delete</button> 
                                <button onClick={() => setViewTodo(todo)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition ml-2">View</button>  
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {ismodalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-96">  
                        <h3 className="text-lg font-semibold mb-4">Edit Todo</h3>
                        <label className="block mb-2">
                            Title:
                            <input type="text" value={currentTodo.title} onChange={(e) => setCurrentTodo({...currentTodo, title: e.target.value})} className="w-full border border-gray-300 p-2 rounded mt-1" />
                        </label>
                        <label htmlFor="">
                            priority:
                            <select name="priority" id="priority" value={currentTodo.priority} onChange={(e) => setCurrentTodo({...currentTodo, priority: e.target.value})} className="w-full border border-gray-300 p-2 rounded mt-1">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </label>                        
                        <label className="block mb-2">
                            Due Date:
                            <input type="date" value={currentTodo.due_date ? currentTodo.due_date.split('T')[0].split(' ')[0] : ""} onChange={(e) => setCurrentTodo({...currentTodo, due_date: e.target.value})} className="w-full border border-gray-300 p-2 rounded mt-1" />   
                        </label>
                        <label className="block mb-4">
                            Status:
                            <select value={currentTodo.completed} onChange={(e) => setCurrentTodo({...currentTodo, completed: e.target.value === 'true'})} className="w-full border border-gray-300 p-2 rounded mt-1">
                                <option value={true}>Completed</option>
                                <option value={false}>Pending</option>  
                            </select>
                        </label>
                        <div className="flex justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition mr-2">Cancel</button>
                            <button onClick={() => handleUpdate(currentTodo)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Save</button>
                        </div>
                    </div>
                </div>
            )}  

            {isPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg w-11/12 h-5/6 overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Todo List PDF Preview</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">Close</button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto flex-1 bg-gray-100">
                            <div className="bg-white p-8 shadow-md border mx-auto max-w-[700px]">
                                <h1 className="text-center text-2xl font-bold border-b pb-4 mb-6">Todo List Summary</h1>
                                <table className="w-full border-collapse border">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border p-2">Task</th>
                                            <th className="border p-2">Priority</th>
                                            <th className="border p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bdTodos.map(todo => (
                                            <tr key={todo.id}>
                                                <td className="border p-2">{todo.title}</td>
                                                <td className="border p-2 text-center capitalize">{todo.priority}</td>
                                                <td className="border p-2 text-center">{todo.completed ? "Done" : "Pending"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                            <div className="p-4 border-t flex justify-end gap-3">
                            <button onClick={() => setIsPreviewOpen(false)} className="px-4 py-2 border rounded">Close</button>
                            <button onClick={downloadPDF} className="px-4 py-2 bg-green-600 text-white rounded">Download PDF</button>
                        </div>
                        </div>
                </div>
            )}
           {/* --- Single Todo View Modal --- */}
{viewTodo && (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b bg-indigo-600 flex justify-between items-center text-white">
                <h2 className="text-lg font-bold">Task Details</h2>
                <button onClick={() => setViewTodo(null)} className="text-2xl hover:text-gray-200">&times;</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-500">ID:</span>
                    <span className="text-gray-800">#{viewTodo.id}</span>
                </div>
                <div className="border-b pb-2">
                    <span className="font-semibold text-gray-500 block mb-1">Title:</span>
                    <span className="text-gray-800 text-lg">{viewTodo.title}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-500">Priority:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        viewTodo.priority === 'high' ? 'bg-red-100 text-red-600' : 
                        viewTodo.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                    }`}>
                        {viewTodo.priority}
                    </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-500">Due Date:</span>
                    <span className="text-gray-800">{viewTodo.due_date || 'No date set'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                    <span className="font-semibold text-gray-500">Status:</span>
                    <span className={`font-bold ${viewTodo.completed ? 'text-green-600' : 'text-orange-500'}`}>
                        {viewTodo.completed ? 'Completed' : 'Pending'}
                    </span>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 flex justify-end">
                <button onClick={() => downloadSinglePDF(viewTodo)} className="px-4 py-2 bg-green-600 text-white rounded">Download PDF</button>

                <button 
                    onClick={() => setViewTodo(null)} 
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-black transition"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

            
        </div>
    );
}
export default TodosTable;