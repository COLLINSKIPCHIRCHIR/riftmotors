import { useEffect, useState } from "react";
import { useParams ,useNavigate} from "react-router-dom";
import API from "../../api/api";


const StockHistory = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
 

  useEffect(() => {
    API.get(`/stock-movements/${id}`)
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, [id]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Stock History</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Type</th>
            <th>Quantity</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
        {history.length === 0 && (
          <tr>
            <td colSpan="3" className="text-center py-4">
              No stock history found.
            </td>
          </tr>
        )}

        {history.map((item) => (
          <tr key={item.id}>
            <td>{item.type}</td>
            <td>{item.quantity}</td>
            <td>{new Date(item.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>

      </table>
    </div>
  );
};

export default StockHistory;
