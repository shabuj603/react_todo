import Todo from "../../pages/Todo";
import Card from "./Card";
import Sidebar from "./Sidebar";
import TodosTable from "./TodosTable";


const AdminDashboard = () => {
    return(
    <div className="flex min-h-screen p-8">    
        <Sidebar />    
        <div className="flex-grow ml-6">
            <div className="flex-1 p-6 bg-gray-100 min-h-screen rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card title="Users" value="120" /> 
                    <Card title="Todos" value="520" /> 
                    <Card title="Completed" value="340" />
                </div>               
                <TodosTable/>   
                <h1>to app</h1>          
            </div>
        </div>
      
    </div>
    )
}
export default AdminDashboard;