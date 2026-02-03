const Sidebar = () => {
  return (
        <aside className="w-64 bg-gray-900 text-white imn-h-scree p-4">
            <h2 className="text-xl font-bold mb-6">Admin</h2>
            <ul className="space-y-4">
                <li className="hover:text-blue-400 cursor-pointer">Dashboard</li>
                <li className="hover:text-blue-400 cursor-pointer">Users</li>
                <li className="hover:text-blue-400 cursor-pointer">Settings</li>   
                <li className="hover:text-blue-400 cursor-pointer">Todos</li>   
                <li className="hover:text-blue-400 cursor-pointer">Logout</li>   
            </ul>
        </aside>
  );
}
export default Sidebar;