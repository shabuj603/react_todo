const Card = ({ title, value }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow"> 
        <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
        <p className="text-2xl font-bold mt-4">{value}</p>
    </div>
  );
}
export default Card;